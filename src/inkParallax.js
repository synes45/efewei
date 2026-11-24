// Match .portal-sway's existing CSS animation; its currentTime is the only clock.
export const SWAY_PERIOD=9000;
export const PARALLAX_GAIN=1.8;
export const SWAY_LIMITS=[2.5,5];
const points=[[0,0],[2.5,-5],[-2,-1],[1.5,3.5],[0,0]];

// CSS ease-in-out: cubic-bezier(.42,0,.58,1), applied to each keyframe interval.
function easeInOut(value){
  if(value===0||value===1)return value;
  let low=0,high=1;
  for(let i=0;i<16;i++){
    const t=(low+high)/2,other=1-t;
    const x=3*.42*other*other*t+3*.58*other*t*t+t*t*t;
    if(x<value)low=t;else high=t;
  }
  const t=(low+high)/2;
  return t*t*(3-2*t);
}

export function wordmarkOffset(time){
  if(!Number.isFinite(time))return [0,0];
  const phase=((time%SWAY_PERIOD)+SWAY_PERIOD)%SWAY_PERIOD/SWAY_PERIOD*4;
  const index=Math.floor(phase),amount=easeInOut(phase-index);
  return points[index].map((value,axis)=>value+(points[index+1][axis]-value)*amount);
}

export function inkParallax(time,width,height,reduced=false){
  if(reduced||!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)return [0,0];
  const [x,y]=wordmarkOffset(time);
  // Sampling +X moves the drawing left; texture +Y moves it down in CSS space.
  return [x*PARALLAX_GAIN/width,-y*PARALLAX_GAIN/height];
}
