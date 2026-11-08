'use client';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import {useEffect,useMemo,useRef,useState} from 'react';
import * as THREE from 'three';
const vertex=`
uniform float uTime;
uniform vec2 uPointer;
uniform float uImpulse;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorld;
varying float vElevation;
void main(){
 vUv=uv;
 vec3 pos=position;
 float dist=distance(uv,uPointer);
 float interaction=exp(-dist*dist*13.0);
 float wave=sin(pos.x*1.7+uTime*0.82)*0.19+cos(pos.y*2.2-uTime*0.63)*0.16;
 float fine=sin(pos.x*4.3+pos.y*2.8+uTime*1.4)*0.055;
 pos.z+=wave+fine+interaction*(0.42+uImpulse*0.52);
 pos.x+=sin(pos.y*1.1+uTime*0.5)*0.11;
 vElevation=pos.z;
 vec4 world=modelMatrix*vec4(pos,1.0);
 vWorld=world.xyz;
 vNormal=normalize(normalMatrix*normal);
 gl_Position=projectionMatrix*viewMatrix*world;
}`;
const fragment=`
uniform float uTime;
uniform vec3 uBase;
uniform vec3 uAccent;
uniform float uMode;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorld;
varying float vElevation;
void main(){
 vec3 normal=normalize(vNormal);
 float fresnel=pow(1.0-abs(dot(normal,normalize(vec3(0.2,0.4,1.0)))),2.2);
 float lines=sin(vUv.y*460.0+vElevation*24.0);
 float weave=sin(vUv.x*660.0)*sin(vUv.y*660.0);
 float sheen=pow(max(0.0,dot(normal,normalize(vec3(-0.6,0.9,0.8)))),3.0);
 float iridescence=sin(vElevation*3.4+vUv.x*4.0+uTime*0.15)*0.5+0.5;
 vec3 base=mix(uBase,uAccent,clamp(fresnel*0.85+iridescence*0.22,0.0,1.0));
 vec3 pearl=mix(vec3(0.8,0.83,0.86),vec3(0.9,0.94,1.0),iridescence);
 base=mix(base,pearl,step(0.5,uMode)*0.7);
 base+=vec3(0.1,0.16,0.15)*sheen+vec3(0.08)*fresnel;
 base+=lines*0.018+weave*0.015;
 float alpha=0.98;
 gl_FragColor=vec4(base,alpha);
}`;
function Fabric({mode,impulse}:{mode:number;impulse:number}){
 const ref=useRef<THREE.Mesh>(null);
 const {pointer}=useThree();
 const uniforms=useMemo(()=>({uTime:{value:0},uPointer:{value:new THREE.Vector2(.5,.5)},uImpulse:{value:0},uBase:{value:new THREE.Color('#3438a0')},uAccent:{value:new THREE.Color('#b9f5e1')},uMode:{value:0}}),[]);
 useFrame(({clock},delta)=>{uniforms.uTime.value=clock.elapsedTime;uniforms.uPointer.value.lerp(new THREE.Vector2(pointer.x*.5+.5,pointer.y*.5+.5),.05);uniforms.uImpulse.value=THREE.MathUtils.lerp(uniforms.uImpulse.value,impulse,.07);uniforms.uMode.value=THREE.MathUtils.lerp(uniforms.uMode.value,mode,.04);if(ref.current){ref.current.rotation.y=THREE.MathUtils.lerp(ref.current.rotation.y,pointer.x*.1,.025);ref.current.rotation.x=THREE.MathUtils.lerp(ref.current.rotation.x,-.13+pointer.y*.07,.025)}});
 return <mesh ref={ref} rotation={[-.13,0,-.18]} scale={[1.2,1.3,1]}><planeGeometry args={[4.8,4.5,170,170]}/><shaderMaterial side={THREE.DoubleSide} vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms}/></mesh>
}
function Threads(){const lines=useMemo(()=>Array.from({length:15},(_,i)=>i),[]);return <group>{lines.map(i=><mesh key={i} position={[(i-7)*.33,0,-.9]} rotation={[0,0,-.1]}><planeGeometry args={[.005,6]}/><meshBasicMaterial color="#7b82ad" transparent opacity={.08}/></mesh>)}</group>}
export default function Scene(){
 const [mode,setMode]=useState(0);const [impulse,setImpulse]=useState(0);
 useEffect(()=>{if(!impulse)return;const t=setTimeout(()=>setImpulse(0),500);return()=>clearTimeout(t)},[impulse]);
 return <div className="fabricExperience">
 <div className="fabricCanvas" onPointerDown={()=>setImpulse(1)}><Canvas camera={{position:[0,0,6.6],fov:46}} dpr={[1,1.6]} gl={{alpha:true,antialias:true}}><ambientLight intensity={.8}/><Fabric mode={mode} impulse={impulse}/><Threads/></Canvas></div>
 <div className="fabricUi"><div className="fabricUiTop"><span className="fabricBlink"/> LIVE MATERIAL SIMULATION <span className="fabricCoordinates">X / Y INTERACTIVE</span></div><div className="fabricUiBottom"><div className="fabricMaterials"><span>FABRIC / 001</span><button className={mode===0?'chosen':''} onClick={()=>setMode(0)} aria-label="Материал Iridescent"><span style={{background:'linear-gradient(135deg,#454ca6,#b8f5e1)'}}/></button><button className={mode===1?'chosen':''} onClick={()=>setMode(1)} aria-label="Материал Pearl"><span style={{background:'linear-gradient(135deg,#e8e8ee,#b6c2d8)'}}/></button></div><span>MOVE / TOUCH / EXPLORE</span></div></div>
 </div>
}