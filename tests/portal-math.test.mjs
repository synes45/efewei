import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { E_COUNTER,E_FOCUS,WORD_BOX,portalGeometry,smoothProgress } from '../src/portalMath.js';

const numbers=value=>value.match(/[-+]?(?:\d*\.?\d+)(?:e[-+]?\d+)?/gi).map(Number);
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
const screens=[[320,568],[390,844],[844,390],[1440,900],[2560,1440]];

test('portal contour and viewBox match the actual wordmark',()=>{
  const wordmark=JSON.parse(readFileSync(new URL('../src/wordmark.json',import.meta.url)));
  assert.deepEqual(numbers(wordmark.viewBox),Object.values(WORD_BOX));
  const counter=wordmark.word.split('M').slice(1).find(part=>{
    const values=numbers(part);return values[0]===63.6&&values[1]===-35.7;
  });
  assert.ok(counter);assert.deepEqual(numbers(counter),numbers(E_COUNTER));
});

test('the resting logo keeps its original optical center',()=>{
  for(const [width,height] of screens){
    const geometry=portalGeometry(width,height,0);
    close((WORD_BOX.x+WORD_BOX.width/2)*geometry.scale+geometry.tx,width/2);
    close((WORD_BOX.y+WORD_BOX.height/2)*geometry.scale+geometry.ty,height/2);
    close(WORD_BOX.width*geometry.scale,geometry.logoWidth);
  }
});

test('the final e opening is centered and covers every viewport corner',()=>{
  for(const [width,height] of screens){
    const geometry=portalGeometry(width,height,1);
    close(E_FOCUS.x*geometry.a+E_FOCUS.y*geometry.c+geometry.tx,width/2);
    close(E_FOCUS.x*geometry.b+E_FOCUS.y*geometry.d+geometry.ty,height/2);
    assert.ok(E_FOCUS.radius*geometry.scale>Math.hypot(width,height)/2);
    close(geometry.opacity,0);
  }
});

test('the final aperture keeps enough margin for the restored screen-space sway',()=>{
  const maximumDrift=Math.hypot(2.5,5);
  for(const [width,height] of screens){
    const geometry=portalGeometry(width,height,1);
    assert.ok(E_FOCUS.radius*geometry.scale>Math.hypot(width,height)/2+maximumDrift);
  }
});

test('the e focus and safety radius stay inside the actual curved counter',()=>{
  const values=numbers(E_COUNTER),points=[];
  let start=values.slice(0,2);
  for(let index=2;index<values.length;index+=6){
    const a=values.slice(index,index+2),b=values.slice(index+2,index+4),end=values.slice(index+4,index+6);
    for(let i=0;i<80;i++){
      const t=i/80;
      points.push([0,1].map(k=>(1-t)**3*start[k]+3*(1-t)**2*t*a[k]+3*(1-t)*t*t*b[k]+t**3*end[k]));
    }
    start=end;
  }
  let inside=false,distance=Infinity;
  points.forEach((a,index)=>{
    const b=points[(index+1)%points.length],vx=b[0]-a[0],vy=b[1]-a[1];
    if((a[1]>E_FOCUS.y)!==(b[1]>E_FOCUS.y)&&E_FOCUS.x<(b[0]-a[0])*(E_FOCUS.y-a[1])/(b[1]-a[1])+a[0])inside=!inside;
    const length=vx*vx+vy*vy;
    const t=length?Math.max(0,Math.min(1,((E_FOCUS.x-a[0])*vx+(E_FOCUS.y-a[1])*vy)/length)):0;
    distance=Math.min(distance,Math.hypot(E_FOCUS.x-a[0]-vx*t,E_FOCUS.y-a[1]-vy*t));
  });
  assert.ok(inside);assert.ok(distance>E_FOCUS.radius);
});

test('zoom values remain finite and monotonic in both orientations',()=>{
  for(const [width,height] of screens){
    let previous=0;
    for(let i=0;i<=100;i++){
      const geometry=portalGeometry(width,height,i/100);
      for(const key of ['scale','tx','ty','a','b','c','d','rotation','holeX','holeY','logoWidth','logoHeight','opacity','projectReveal'])assert.ok(Number.isFinite(geometry[key]));
      assert.ok(geometry.scale>=previous);previous=geometry.scale;
      assert.ok(geometry.opacity>=0&&geometry.opacity<=1);
    }
  }
  close(smoothProgress(-1),0);close(smoothProgress(.5),.5);close(smoothProgress(2),1);
});

test('camera preparation pans before zooming, with a restrained roll',()=>{
  for(const [width,height] of screens){
    const start=portalGeometry(width,height,0),prepare=portalGeometry(width,height,.1);
    close(start.scale,prepare.scale);
    assert.ok(Math.hypot(prepare.holeX-start.holeX,prepare.holeY-start.holeY)>0);
    assert.ok(Math.abs(prepare.rotation)>0);
    for(let i=0;i<=100;i++)assert.ok(Math.abs(portalGeometry(width,height,i/100).rotation)<=3.2+1e-8);
    close(portalGeometry(width,height,0).rotation,0);close(portalGeometry(width,height,1).rotation,0);
  }
});

test('the real e focus follows the same affine transform as the aperture',()=>{
  for(const [width,height] of screens){
    for(let i=0;i<=100;i++){
      const geometry=portalGeometry(width,height,i/100);
      close(E_FOCUS.x*geometry.a+E_FOCUS.y*geometry.c+geometry.tx,geometry.holeX);
      close(E_FOCUS.x*geometry.b+E_FOCUS.y*geometry.d+geometry.ty,geometry.holeY);
    }
  }
});

test('leaf planes follow the word camera instead of staying fixed on screen',()=>{
  for(const [width,height] of screens){
    for(let i=0;i<=100;i++){
      const geometry=portalGeometry(width,height,i/100),matrix=numbers(geometry.leafTransform);
      const base=geometry.logoWidth/WORD_BOX.width;
      for(const [localX,localY] of [[0,0],[geometry.logoWidth/2,geometry.logoHeight/2],[geometry.logoWidth+20,-30]]){
        const wordX=WORD_BOX.x+localX/base,wordY=WORD_BOX.y+localY/base;
        close(matrix[0]*localX+matrix[2]*localY+matrix[4],geometry.a*wordX+geometry.c*wordY+geometry.tx);
        close(matrix[1]*localX+matrix[3]*localY+matrix[5],geometry.b*wordX+geometry.d*wordY+geometry.ty);
      }
    }
    const resting=portalGeometry(width,height,0),moving=portalGeometry(width,height,.6);
    assert.notEqual(resting.leafTransform,moving.leafTransform);
  }
});

test('project reveals share the camera timeline and reverse without a timer',()=>{
  for(const [width,height] of screens){
    let previous=0;
    for(let i=0;i<=100;i++){
      const {projectReveal}=portalGeometry(width,height,i/100);
      assert.ok(projectReveal>=previous-1e-10&&projectReveal<=1+1e-10);previous=projectReveal;
      for(let index=0;index<3;index++){
        const t=Math.max(0,Math.min(1,projectReveal*1.24-index*.12)),row=t*t*(3-2*t);
        if(i===0)close(row,0);if(i===100)close(row,1);
      }
    }
    close(portalGeometry(width,height,.2).projectReveal,0);
    close(portalGeometry(width,height,.95).projectReveal,1);
  }
});
