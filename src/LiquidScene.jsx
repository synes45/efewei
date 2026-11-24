import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { liquidGradient } from './liquidGradient.js';
import { inkTexturePath, inkViewport } from './starryNightMapping.js';
import StarryNight from './StarryNight.jsx';
import { inkParallax } from './inkParallax.js';

export default function LiquidScene({reduced,theme}){
  const hostRef=useRef(null),reducedRef=useRef(reduced),swayRef=useRef(null),themeRef=useRef(theme);
  themeRef.current=theme;
  const [fallback,setFallback]=useState(false);
  const [artFallback,setArtFallback]=useState(false);
  useEffect(()=>{
    reducedRef.current=reduced;
    const animations=reduced?[]:document.querySelector('.portal-sway')?.getAnimations?.()||[];
    swayRef.current=animations.find(animation=>animation.animationName==='portal-sway')||null;
  },[reduced]);
  useEffect(()=>{
    const host=hostRef.current;
    let renderer;
    try{renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'low-power'});}catch{setFallback(true);return;}
    host.appendChild(renderer.domElement);
    const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
    const emptyInk=new THREE.DataTexture(new Uint8Array([0,0,0,0]),1,1);emptyInk.needsUpdate=true;
    const uniforms={uTime:{value:0},uResolution:{value:new THREE.Vector2(1,1)},uInk:{value:emptyInk},uInkReady:{value:0},uInkScale:{value:new THREE.Vector2(1,1)},uInkCenter:{value:new THREE.Vector2(.5,.5)},uInkParallax:{value:new THREE.Vector2(0,0)},uTheme:{value:theme==='light'?1:0}};
    const geometry=new THREE.PlaneGeometry(2,2),material=new THREE.ShaderMaterial({glslVersion:THREE.GLSL3,uniforms,fragmentShader:liquidGradient,vertexShader:'out vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,1.);}'});
    scene.add(new THREE.Mesh(geometry,material));
    let frame,last=0,time=0,dirty=true,disposed=false,artAspect,interval=1000/60,count=0;
    const mapInk=()=>{const {scale,center}=inkViewport(Math.max(1,host.clientWidth),Math.max(1,host.clientHeight),artAspect);uniforms.uInkScale.value.fromArray(scale);uniforms.uInkCenter.value.fromArray(center);};
    // The ink texture (≤1600px) and the smooth field carry no detail above ~1.25x; fewer pixels pay for ~60fps.
    const resize=()=>{const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.25,Math.sqrt(1300000/(w*h))));renderer.setSize(w,h);uniforms.uResolution.value.set(w,h);mapInk();dirty=true;};
    const observer=new ResizeObserver(resize);observer.observe(host);resize();
    const artwork=new THREE.TextureLoader().load(inkTexturePath(host.clientWidth),texture=>{
      if(disposed){texture.dispose();return;}
      texture.colorSpace=THREE.NoColorSpace;
      artAspect=texture.image.width/texture.image.height;
      uniforms.uInk.value=texture;uniforms.uInkReady.value=1;mapInk();dirty=true;
    },undefined,()=>{if(!disposed)setArtFallback(true);});
    const lost=e=>{e.preventDefault();cancelAnimationFrame(frame);setFallback(true);};renderer.domElement.addEventListener('webglcontextlost',lost);
    const animate=now=>{
      frame=requestAnimationFrame(animate);const delta=last?Math.min((now-last)/1000,.08):0;last=now;
      if(delta)interval+=(delta*1000-interval)*.05;
      if(document.hidden)return;
      if(!reducedRef.current){time+=delta;dirty=true;}
      // ~300ms palette crossfade on theme change; exactly 0 keeps the dark shader unchanged.
      const themeMix=uniforms.uTheme.value,themeTarget=themeRef.current==='light'?1:0;
      if(themeMix!==themeTarget){uniforms.uTheme.value=themeTarget>themeMix?Math.min(1,themeMix+delta/.3):Math.max(0,themeMix-delta/.3);dirty=true;}
      const animationTime=swayRef.current?.currentTime;
      const [px,py]=inkParallax(typeof animationTime==='number'?animationTime:0,uniforms.uResolution.value.x,uniforms.uResolution.value.y,reducedRef.current);
      if(uniforms.uInkParallax.value.x!==px||uniforms.uInkParallax.value.y!==py){uniforms.uInkParallax.value.set(px,py);dirty=true;}
      // Steady ~60fps: every Nth display frame (60Hz:1, 120Hz:2, 144Hz:2, 180Hz:3), never an uneven 30/35fps cap.
      if(++count<Math.max(1,Math.round(1000/60/interval))||!dirty)return;
      count=0;uniforms.uTime.value=time;
      try{renderer.render(scene,camera);}catch{cancelAnimationFrame(frame);setFallback(true);return;}
      dirty=false;
    };
    frame=requestAnimationFrame(animate);
    return()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();renderer.domElement.removeEventListener('webglcontextlost',lost);artwork.dispose();emptyInk.dispose();geometry.dispose();material.dispose();renderer.dispose();renderer.domElement.remove();};
  },[]);
  return <div ref={hostRef} className={`liquid-scene${fallback?' liquid-fallback':''}${reduced?' reduced-motion':''}`} aria-hidden="true">{fallback||artFallback?<StarryNight/>:null}</div>;
}
