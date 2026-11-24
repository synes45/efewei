import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import LeafFall from './LeafFall.jsx';
import HeroBio from './HeroBio.jsx';
import Projects from './Projects.jsx';
import WordmarkArt from './WordmarkArt.jsx';
import { gestureVelocity, portalGeometry, smoothProgress, springStep } from './portalMath.js';

const interactive=target=>Boolean(target.closest?.('button,a,input,select,textarea,[contenteditable=true]'));

export default function MotionScene({reduced}){
  const root=useRef(null),layer=useRef(null),svg=useRef(null),word=useRef(null),stage=useRef(null);
  const backLeaves=useRef(null),frontLeaves=useRef(null);
  const projectScroll=useRef(null),projectTitle=useRef(null),cue=useRef(null);
  const size=useRef({width:1,height:1}),progress=useRef(0),speed=useRef(0),frame=useRef(0);
  const phaseRef=useRef('hero'),target=useRef(0),reduce=useRef(reduced),navigated=useRef(false);
  const gesture=useRef({lastWheel:0,direction:0,started:0,sum:0,swallow:false,touch:null});
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
      // Same matrix as CSS (user units are CSS px): moves the composited leaf layers without repainting them.
      const leaves=geometry.leafTransform.replaceAll(' ',',');
      if(backLeaves.current)backLeaves.current.style.transform=leaves;
      if(frontLeaves.current)frontLeaves.current.style.transform=leaves;
    }
    if(layer.current){layer.current.style.opacity=wordOpacity;layer.current.style.visibility=wordOpacity===0?'hidden':'visible';}
    if(stage.current)stage.current.style.opacity=smoothProgress((value-.30)/.55);
    projectScroll.current?.style.setProperty('--project-reveal',reveal);
  },[]);
  const finish=useCallback(destination=>{
    cancelAnimationFrame(frame.current);frame.current=0;speed.current=0;draw(destination);
    phaseRef.current=destination?'projects':'hero';setPhase(phaseRef.current);
    if(!destination)svg.current?.unpauseAnimations?.();
  },[draw]);
  const navigate=useCallback((destination,velocity=0)=>{
    if(target.current===destination)return;
    target.current=destination;navigated.current=true;
    if(destination&&projectScroll.current)projectScroll.current.scrollTop=0;
    if(reduce.current){finish(destination);return;}
    phaseRef.current=destination?'opening':'closing';setPhase(phaseRef.current);
    // The 22s chrome sweep barely moves during a ~1.5s zoom; freezing it (no reset) removes its per-frame style/repaint.
    svg.current?.pauseAnimations?.();
    // Re-target from the live value and velocity; a gesture only adds speed toward the new target.
    speed.current+=destination?velocity:-velocity;
    if(frame.current)return;
    let last=performance.now();
    const tick=now=>{
      // Each camera channel has its own easing, all driven by the one spring value.
      const step=springStep(progress.current,speed.current,target.current,Math.max(0,now-last)/1000);
      last=now;speed.current=step.velocity;
      // Every camera/fade channel is flat within .5% of either end, so settling here cannot show a snap.
      if(Math.abs(step.position-target.current)<5e-3&&Math.abs(step.velocity)<5e-2)finish(target.current);
      else{draw(step.position);frame.current=requestAnimationFrame(tick);}
    };
    frame.current=requestAnimationFrame(tick);
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
      const g=gesture.current,now=performance.now();
      const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?size.current.height:1);
      // A pause or a reversal starts a new wheel stream.
      if(now-g.lastWheel>180||Math.sign(delta)!==g.direction){g.sum=0;g.started=now;g.swallow=false;}
      g.lastWheel=now;g.direction=Math.sign(delta);
      // The momentum tail of the stream that already navigated must not scroll the list or navigate again.
      if(g.swallow){event.preventDefault();return;}
      const open=delta>0&&(moving()||phaseRef.current==='hero');
      const close=delta<0&&(moving()||phaseRef.current==='projects'&&atTop());
      if(!open&&!close)return;
      event.preventDefault();
      const destination=open?1:0;
      if(destination===target.current)return;
      g.sum+=Math.abs(delta);
      if(g.sum>=24){g.swallow=true;navigate(destination,gestureVelocity(g.sum/Math.max(16,now-g.started)*1000,size.current.height));}
    };
    const touchStart=event=>{
      gesture.current.touch=null;
      if(event.touches.length!==1||interactive(event.target))return;
      const point=event.touches[0];
      gesture.current.touch={x:point.clientX,y:point.clientY,time:performance.now(),atTop:atTop()};
    };
    const touchMove=event=>{
      const start=gesture.current.touch;
      if(!start||event.touches.length!==1)return;
      const point=event.touches[0],dy=point.clientY-start.y,dx=point.clientX-start.x;
      if(Math.abs(dy)<=Math.abs(dx)*1.2)return;
      const open=dy<0&&(moving()||phaseRef.current==='hero');
      const close=dy>0&&(moving()||phaseRef.current==='projects'&&start.atTop);
      if(!open&&!close)return;
      event.preventDefault();
      const destination=open?1:0,now=performance.now();
      // Same direction as the target: follow the finger so a later reversal is measured from its turning point.
      if(destination===target.current){Object.assign(start,{x:point.clientX,y:point.clientY,time:now});return;}
      if(Math.abs(dy)<(destination===1||moving()?12:52))return;
      gesture.current.touch={x:point.clientX,y:point.clientY,time:now,atTop:true};
      navigate(destination,gestureVelocity(Math.abs(dy)/Math.max(16,now-start.time)*1000,size.current.height));
    };
    const touchEnd=()=>{gesture.current.touch=null;};
    const key=event=>{
      if(event.ctrlKey||event.metaKey||event.altKey||event.repeat)return;
      if(event.key==='Escape'&&target.current===1){event.preventDefault();navigate(0);return;}
      if(interactive(event.target))return;
      if(target.current===0&&['ArrowDown','PageDown',' '].includes(event.key)){event.preventDefault();navigate(1);}
      else if(target.current===1&&atTop()&&['ArrowUp','PageUp'].includes(event.key)){event.preventDefault();navigate(0);}
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
      <div className="project-sway">
        <div ref={projectScroll} className="project-scroll" role="region" aria-label="Projeler" tabIndex={phase==='projects'?0:-1}>
          <Projects titleRef={projectTitle} onBack={()=>navigate(0)}/>
        </div>
      </div>
    </div>
    {/* Sway and leaves are HTML layers so their CSS animations stay on the compositor; only the word is SVG. */}
    <div ref={layer} className="portal-word" aria-hidden="true">
      <div className="portal-sway">
        <div ref={backLeaves} className="leaf-plane"><LeafFall layer="back" width={leafBox.width} height={leafBox.height}/></div>
        <svg ref={svg} className="portal-art" viewBox="0 0 1 1" preserveAspectRatio="none" focusable="false"><g ref={word}><WordmarkArt reduced={reduced}/></g></svg>
        <div ref={frontLeaves} className="leaf-plane"><LeafFall layer="front" width={leafBox.width} height={leafBox.height}/></div>
      </div>
    </div>
    <header className="hero-controls" inert={phase!=='hero'} aria-hidden={phase!=='hero'}>
      <h1 className="screen-reader-only">wei.</h1>
      <div className="hero-sway"><HeroBio reduced={reduced}/></div>
      <button ref={cue} type="button" className="scene-cue" aria-label="Projeleri aç" title="Projeleri aç" onClick={()=>navigate(1)}><ArrowDown size={17} strokeWidth={1.2}/></button>
    </header>
  </div>;
}
