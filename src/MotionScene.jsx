import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import LeafFall from './LeafFall.jsx';
import Projects from './Projects.jsx';
import WordmarkArt from './WordmarkArt.jsx';
import { portalGeometry, smoothProgress } from './portalMath.js';

const OPEN_DURATION=1650,CLOSE_DURATION=1400;
const interactive=target=>Boolean(target.closest?.('button,a,input,select,textarea,[contenteditable=true]'));

export default function MotionScene({reduced}){
  const root=useRef(null),svg=useRef(null),word=useRef(null),stage=useRef(null);
  const backLeaves=useRef(null),frontLeaves=useRef(null);
  const projectScroll=useRef(null),projectTitle=useRef(null),cue=useRef(null);
  const size=useRef({width:1,height:1}),progress=useRef(0),frame=useRef(0);
  const phaseRef=useRef('hero'),target=useRef(0),reduce=useRef(reduced),navigated=useRef(false);
  const gesture=useRef({lastWheel:0,blocked:false,sum:0,touch:null});
  const [phase,setPhase]=useState('hero');
  const [leafBox,setLeafBox]=useState({width:113,height:36});
  const draw=useCallback(value=>{
    progress.current=value;
    // Stop expanding the complex SVG before it becomes a screen-sized raster.
    const geometry=portalGeometry(size.current.width,size.current.height,Math.min(value,.58));
    const reveal=portalGeometry(size.current.width,size.current.height,value).projectReveal;
    const wordOpacity=1-smoothProgress((value-.38)/.24);
    if(wordOpacity>0){
      word.current?.setAttribute('transform',geometry.transform);
      backLeaves.current?.setAttribute('transform',geometry.leafTransform);
      frontLeaves.current?.setAttribute('transform',geometry.leafTransform);
    }
    if(svg.current){svg.current.style.opacity=wordOpacity;svg.current.style.visibility=wordOpacity===0?'hidden':'visible';}
    if(stage.current)stage.current.style.opacity=smoothProgress((value-.30)/.55);
    projectScroll.current?.style.setProperty('--project-reveal',reveal);
  },[]);
  const finish=useCallback(destination=>{
    cancelAnimationFrame(frame.current);frame.current=0;draw(destination);
    phaseRef.current=destination?'projects':'hero';setPhase(phaseRef.current);
  },[draw]);
  const navigate=useCallback(destination=>{
    if(phaseRef.current==='opening'||phaseRef.current==='closing'||progress.current===destination)return;
    target.current=destination;navigated.current=true;
    gesture.current.blocked=true;gesture.current.sum=0;
    if(destination&&projectScroll.current)projectScroll.current.scrollTop=0;
    if(reduce.current){finish(destination);return;}
    phaseRef.current=destination?'opening':'closing';setPhase(phaseRef.current);
    const from=progress.current,started=performance.now(),duration=destination?OPEN_DURATION:CLOSE_DURATION;
    const animate=now=>{
      const elapsed=Math.min(1,(now-started)/duration);
      // Each camera channel has its own easing, all on the same timeline.
      draw(from+(destination-from)*elapsed);
      if(elapsed<1)frame.current=requestAnimationFrame(animate);else finish(destination);
    };
    frame.current=requestAnimationFrame(animate);
  },[draw,finish]);

  useLayoutEffect(()=>{
    const measure=()=>{
      const node=root.current;if(!node)return;
      size.current={width:node.clientWidth,height:node.clientHeight};
      svg.current.setAttribute('viewBox',`0 0 ${size.current.width} ${size.current.height}`);
      const geometry=portalGeometry(size.current.width,size.current.height,progress.current);
      setLeafBox(previous=>previous.width===geometry.logoWidth&&previous.height===geometry.logoHeight?previous:{width:geometry.logoWidth,height:geometry.logoHeight});
      draw(progress.current);
    };
    measure();const observer=new ResizeObserver(measure);observer.observe(root.current);
    return()=>{observer.disconnect();cancelAnimationFrame(frame.current);};
  },[draw]);
  useEffect(()=>{
    reduce.current=reduced;
    if(reduced&&(phaseRef.current==='opening'||phaseRef.current==='closing'))finish(target.current);
  },[reduced,finish]);
  useEffect(()=>{
    if(!navigated.current)return;
    if(phase==='projects')projectTitle.current?.focus({preventScroll:true});
    if(phase==='hero')root.current?.focus({preventScroll:true});
  },[phase]);

  useEffect(()=>{
    const node=root.current;
    const moving=()=>phaseRef.current==='opening'||phaseRef.current==='closing';
    const atTop=()=>!projectScroll.current||projectScroll.current.scrollTop<=1;
    const wheel=event=>{
      if(event.ctrlKey||Math.abs(event.deltaX)>Math.abs(event.deltaY)||interactive(event.target))return;
      const now=performance.now(),idle=now-gesture.current.lastWheel;
      gesture.current.lastWheel=now;
      if(moving()){event.preventDefault();return;}
      // Do not treat the tail of one trackpad gesture as a second navigation.
      if(gesture.current.blocked&&idle<180){event.preventDefault();return;}
      gesture.current.blocked=false;
      const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?size.current.height:1);
      const open=phaseRef.current==='hero'&&delta>0;
      const close=phaseRef.current==='projects'&&atTop()&&delta<0;
      if(!open&&!close){gesture.current.sum=0;return;}
      event.preventDefault();
      if(idle>180)gesture.current.sum=0;
      gesture.current.sum+=Math.abs(delta);
      if(gesture.current.sum>=24)navigate(open?1:0);
    };
    const touchStart=event=>{
      gesture.current.touch=null;
      if(event.touches.length!==1||interactive(event.target))return;
      const point=event.touches[0];
      gesture.current.touch={x:point.clientX,y:point.clientY,atTop:atTop()};
    };
    const touchMove=event=>{
      const start=gesture.current.touch;
      if(!start||event.touches.length!==1)return;
      const point=event.touches[0],dy=point.clientY-start.y,dx=point.clientX-start.x;
      if(Math.abs(dy)<=Math.abs(dx)*1.2)return;
      if(moving()){event.preventDefault();return;}
      const open=phaseRef.current==='hero'&&dy<0;
      const close=phaseRef.current==='projects'&&start.atTop&&dy>0;
      if(!open&&!close)return;
      event.preventDefault();
      if(Math.abs(dy)>=52){gesture.current.touch=null;navigate(open?1:0);}
    };
    const touchEnd=()=>{gesture.current.touch=null;};
    const key=event=>{
      if(event.ctrlKey||event.metaKey||event.altKey||event.repeat)return;
      if(event.key==='Escape'&&phaseRef.current==='projects'){event.preventDefault();navigate(0);return;}
      if(interactive(event.target))return;
      if(phaseRef.current==='hero'&&['ArrowDown','PageDown',' '].includes(event.key)){event.preventDefault();navigate(1);}
      if(phaseRef.current==='projects'&&atTop()&&['ArrowUp','PageUp'].includes(event.key)){event.preventDefault();navigate(0);}
    };
    node.addEventListener('wheel',wheel,{passive:false});
    node.addEventListener('touchstart',touchStart,{passive:true});
    node.addEventListener('touchmove',touchMove,{passive:false});
    node.addEventListener('touchend',touchEnd,{passive:true});
    node.addEventListener('touchcancel',touchEnd,{passive:true});
    document.addEventListener('keydown',key);
    return()=>{
      node.removeEventListener('wheel',wheel);node.removeEventListener('touchstart',touchStart);
      node.removeEventListener('touchmove',touchMove);node.removeEventListener('touchend',touchEnd);
      node.removeEventListener('touchcancel',touchEnd);document.removeEventListener('keydown',key);
    };
  },[navigate]);

  return <div ref={root} className="motion-scene" data-phase={phase} tabIndex={-1}>
    <div ref={stage} className="project-stage" inert={phase!=='projects'} aria-hidden={phase!=='projects'}>
      <div ref={projectScroll} className="project-scroll" role="region" aria-label="Projeler" tabIndex={phase==='projects'?0:-1}>
        <Projects titleRef={projectTitle} onBack={()=>navigate(0)}/>
      </div>
    </div>
    <svg ref={svg} className="portal-word" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <g className="portal-sway">
        <g ref={backLeaves}><LeafFall layer="back" width={leafBox.width} height={leafBox.height}/></g>
        <g ref={word}><WordmarkArt reduced={reduced}/></g>
        <g ref={frontLeaves}><LeafFall layer="front" width={leafBox.width} height={leafBox.height}/></g>
      </g>
    </svg>
    <header className="hero-controls" inert={phase!=='hero'} aria-hidden={phase!=='hero'}>
      <h1 className="screen-reader-only">wei.</h1>
      <button ref={cue} type="button" className="scene-cue" aria-label="Projeleri aç" title="Projeleri aç" onClick={()=>navigate(1)}><ArrowDown size={17} strokeWidth={1.2}/></button>
    </header>
  </div>;
}
