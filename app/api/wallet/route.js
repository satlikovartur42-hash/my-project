import {NextResponse} from 'next/server';
export const dynamic='force-dynamic';
const BASE='https://eth.blockscout.com/api/v2';
export async function GET(request){
 const address=new URL(request.url).searchParams.get('address')||'';
 if(!/^0x[0-9a-fA-F]{40}$/.test(address))return NextResponse.json({error:'Invalid public Ethereum address'},{status:400});
 try{
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),9000);
  let responses;try{responses=await Promise.all([fetch(BASE+'/addresses/'+address+'/token-balances',{signal:controller.signal,cache:'no-store'}),fetch(BASE+'/addresses/'+address+'/transactions',{signal:controller.signal,cache:'no-store'})])}finally{clearTimeout(timeout)}
  if(responses.some(r=>!r.ok))throw Error('Public blockchain indexer unavailable');
  const [tokensRaw,transactionsRaw]=await Promise.all(responses.map(r=>r.json()));
  if(!Array.isArray(tokensRaw)||!Array.isArray(transactionsRaw.items))throw Error('Unexpected blockchain response');
  const tokens=tokensRaw.slice(0,50).map(t=>{const decimals=Number(t.token?.decimals??0);const raw=String(t.value??'0');let amount='Unavailable';if(/^\d+$/.test(raw)&&Number.isInteger(decimals)&&decimals>=0&&decimals<=36){const v=BigInt(raw);const d=10n**BigInt(decimals);amount=(v/d).toString()+(v%d?' .'.trim()+String(v%d).padStart(decimals,'0').replace(/0+$/,''):'')}return{symbol:String(t.token?.symbol||'').slice(0,32),contract:String(t.token?.address_hash||''),amount}});
  const transactions=transactionsRaw.items.slice(0,20).filter(t=>/^0x[0-9a-fA-F]{64}$/.test(t.hash||'')).map(t=>({hash:t.hash,method:String(t.method||'Transaction').slice(0,80)}));
  return NextResponse.json({tokens,transactions},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return NextResponse.json({error:e?.message||'Blockchain data unavailable'},{status:503})}
}