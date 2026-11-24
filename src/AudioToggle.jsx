import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';

const LOOP_START=6.99;
const DEFAULT_END=14.374693877551021;
function resumeAudio(context){
  // Start a silent frame inside the tap, before any fetch/await (mobile Safari).
  const unlock=context.createBufferSource();
  unlock.buffer=context.createBuffer(1,1,context.sampleRate);
  unlock.connect(context.destination);unlock.onended=()=>unlock.disconnect();unlock.start(0);
  const resumed=context.resume();
  let timeout;
  return Promise.race([
    resumed,
    new Promise((_,reject)=>{timeout=setTimeout(()=>reject(new Error('Audio activation timed out')),6000);})
  ]).finally(()=>clearTimeout(timeout));
}
function clock(state){
  if(!state?.source)return {position:0,duration:DEFAULT_END,turn:0};
  const elapsed=Math.max(0,state.context.currentTime-state.startedAt),duration=state.duration,length=duration-LOOP_START;
  return {position:elapsed<duration?elapsed:LOOP_START+(elapsed-duration)%length,duration,turn:elapsed<LOOP_START?0:Math.floor((elapsed-LOOP_START)/length)+1};
}

export default function AudioToggle(){
  const audio=useRef(null),timer=useRef(null),mounted=useRef(true),perimeter=useRef(null);
  const [playing,setPlaying]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState(false);
  const [progress,setProgress]=useState({position:0,duration:DEFAULT_END,turn:0});
  useEffect(()=>{
    mounted.current=true;
    const hide=()=>{if(document.hidden&&audio.current){clearTimeout(timer.current);audio.current.context.suspend().then(()=>{if(mounted.current)setProgress(clock(audio.current));}).catch(()=>{});setPlaying(false);}};
    document.addEventListener('visibilitychange',hide);
    return()=>{mounted.current=false;document.removeEventListener('visibilitychange',hide);clearTimeout(timer.current);audio.current?.controller.abort();if(audio.current){audio.current.context.removeEventListener('statechange',audio.current.sync);audio.current.context.close().catch(()=>{});}};
  },[]);
  useEffect(()=>{
    if(!playing)return;
    let frame,lastUpdate=-Infinity;
    const update=now=>{
      const current=clock(audio.current);
      // Draw each screen frame without re-rendering the player every frame.
      perimeter.current?.setAttribute('stroke-dasharray',`${Math.min(100,current.position/current.duration*100)} 100`);
      if(now-lastUpdate>=250){setProgress(current);lastUpdate=now;}
      frame=requestAnimationFrame(update);
    };
    frame=requestAnimationFrame(update);
    return()=>cancelAnimationFrame(frame);
  },[playing]);
  useEffect(()=>{
    if(!playing)perimeter.current?.setAttribute('stroke-dasharray',`${Math.min(100,progress.position/progress.duration*100)} 100`);
  },[playing,progress.position,progress.duration]);
  const toggle=async()=>{
    if(loading)return;
    clearTimeout(timer.current);
    if(playing&&audio.current){
      const {context,gain}=audio.current;
      gain.gain.cancelScheduledValues(context.currentTime);gain.gain.setValueAtTime(gain.gain.value,context.currentTime);gain.gain.linearRampToValueAtTime(0,context.currentTime+.12);
      setPlaying(false);timer.current=setTimeout(()=>context.suspend().then(()=>{if(mounted.current)setProgress(clock(audio.current));}).catch(()=>{}),150);return;
    }
    setLoading(true);setError(false);
    try{
      // Use the media playback session where supported (including iOS mute mode).
      try{if(navigator.audioSession)navigator.audioSession.type='playback';}catch{}
      if(!audio.current){
        const Context=window.AudioContext||window.webkitAudioContext;
        if(!Context)throw new Error('Web Audio unavailable');
        const context=new Context(),gain=context.createGain(),controller=new AbortController();
        const sync=()=>{
          if(mounted.current&&audio.current?.context===context&&context.state!=='running'){
            setPlaying(false);setProgress(clock(audio.current));
          }
        };
        gain.gain.value=0;gain.connect(context.destination);audio.current={context,gain,controller,source:null,startedAt:0,duration:DEFAULT_END,sync};
        context.addEventListener('statechange',sync);
      }
      const state=audio.current;
      await resumeAudio(state.context);
      if(!mounted.current)return;
      if(!state.source){
        const response=await fetch('/audio/yeniden-intro-loop-v11.wav',{signal:state.controller.signal});
        if(!response.ok)throw new Error('Audio request failed');
        const buffer=await state.context.decodeAudioData(await response.arrayBuffer());
        if(!mounted.current)return;
        const source=state.context.createBufferSource();source.buffer=buffer;source.loop=true;source.loopStart=LOOP_START;source.loopEnd=buffer.duration;source.connect(state.gain);
        state.duration=buffer.duration;state.startedAt=state.context.currentTime;source.start(state.startedAt,0);state.source=source;
      }
      if(document.hidden){await state.context.suspend();return;}
      // Safari may interrupt the context while the file is loading.
      if(state.context.state!=='running')throw new Error('Audio requires another tap');
      state.gain.gain.cancelScheduledValues(state.context.currentTime);state.gain.gain.setValueAtTime(state.gain.gain.value,state.context.currentTime);state.gain.gain.linearRampToValueAtTime(.28,state.context.currentTime+.035);
      if(mounted.current){setProgress(clock(state));setPlaying(true);}
    }catch{if(mounted.current)setError(true);}
    finally{if(mounted.current)setLoading(false);}
  };
  const label=loading?'Müzik yükleniyor':error?'Ses açılamadı, yeniden dene':playing?'Müziği duraklat':'Müziği oynat · BEGE — Yeniden';
  const loopRatio=LOOP_START/progress.duration*100;
  return <section className={`audio-player${loading?' is-loading':''}`} aria-label="Müzik oynatıcı">
    <div className="perimeter-progress" role="progressbar" aria-label="Parça içindeki konum" aria-valuemin={0} aria-valuemax={progress.duration} aria-valuenow={Math.min(progress.duration,Number(progress.position.toFixed(1)))} aria-valuetext={`${progress.position.toFixed(1)} saniye; ${progress.turn>0?'döngü bölümü':'giriş'}; döngü ${LOOP_START.toFixed(2)}–${progress.duration.toFixed(2)} saniye`}>
      <svg viewBox="0 0 172 44" preserveAspectRatio="none" aria-hidden="true">
        <defs><rect id="player-perimeter" x=".75" y=".75" width="170.5" height="42.5" rx="21.25" pathLength="100"/></defs>
        <use href="#player-perimeter" className="perimeter-track"/>
        <use href="#player-perimeter" className="perimeter-loop" strokeDasharray={`${100-loopRatio} 100`} strokeDashoffset={-loopRatio}/>
        <use ref={perimeter} href="#player-perimeter" className="perimeter-fill" strokeDasharray="0 100"/>
        <use href="#player-perimeter" className="perimeter-marker" strokeDasharray=".45 99.55"/>
        <use href="#player-perimeter" className="perimeter-marker" strokeDasharray=".45 99.55" strokeDashoffset={-(loopRatio-.225)}/>
      </svg>
    </div>
    <button type="button" className="record-button" onClick={toggle} aria-label={label} title={label} aria-pressed={playing} aria-busy={loading} disabled={loading}>
      <img className="record-cover" src="/audio/yeniden-cover-v1.jpg" alt="BEGE — Yeniden albüm kapağı" width="112" height="112"/>
      <span className="record-control" aria-hidden="true">{playing?<Pause size={17} fill="currentColor"/>:<Play size={17} fill="currentColor"/>}</span>
    </button>
    <div className="track-content">
      <div className="track-title">BEGE – Yeniden</div>
      {(loading||error)&&<div className="track-status" role="status">{loading?'Yükleniyor…':'Açılamadı · tekrar dene'}</div>}
    </div>
  </section>;
}
