export const WORD_BOX={x:-4.2,y:-48.53844797387331,width:110.74095399636364,height:35.64866710802902};
// The real counter contour inside Astoria's e, not a synthetic circular wipe.
export const E_COUNTER='M63.600-35.700C59.900-31.800 54.500-28.700 51.500-27.400C51.900-28.400 52.500-29.400 53.300-30.500C54.800-32.700 61.400-40.400 64.600-39.800C67.100-39.300 64.700-36.800 63.600-35.700Z';
export const E_FOCUS={x:61.2,y:-36.1,radius:1.9};

// Minimum-jerk easing: both velocity and acceleration settle at the endpoints.
export function smoothProgress(value){const t=Math.max(0,Math.min(1,value));return t*t*t*(t*(t*6-15)+10);}
const curve=(a,b,c,d,t)=>a*(1-t)**3+3*b*(1-t)**2*t+3*c*(1-t)*t*t+d*t*t*t;

export function portalGeometry(width,height,progress){
  const w=Math.max(1,width),h=Math.max(1,height),p=Math.max(0,Math.min(1,progress));
  const logoWidth=w<=600?82:Math.min(113,Math.max(69,w*.0886));
  const base=logoWidth/WORD_BOX.width;
  const end=Math.hypot(w,h)/(2*E_FOCUS.radius)*1.12;
  // First find the e, then accelerate through it, with a long soft landing.
  const dolly=smoothProgress((p-.12)/.84);
  const scale=base*Math.pow(end/base,dolly);
  const tracking=smoothProgress(p/.58);
  const arc=Math.min(24,Math.min(w,h)*.035);
  const x=WORD_BOX.x+WORD_BOX.width/2,y=WORD_BOX.y+WORD_BOX.height/2;
  const startX=w/2+(E_FOCUS.x-x)*base,startY=h/2+(E_FOCUS.y-y)*base;
  const holeX=curve(startX,startX+arc,w/2-arc*.45,w/2,tracking);
  const holeY=curve(startY,startY-arc*.8,h/2+arc*.35,h/2,tracking);
  const rotation=-3.2*Math.sin(Math.PI*smoothProgress(p/.78));
  const angle=rotation*Math.PI/180;
  const a=scale*Math.cos(angle),b=scale*Math.sin(angle),c=-b,d=a;
  const tx=holeX-a*E_FOCUS.x-c*E_FOCUS.y,ty=holeY-b*E_FOCUS.x-d*E_FOCUS.y;
  // Convert the leaves' local pixel coordinates into the same word-space camera.
  const leafTx=a*WORD_BOX.x+c*WORD_BOX.y+tx,leafTy=b*WORD_BOX.x+d*WORD_BOX.y+ty;
  return {scale,tx,ty,a,b,c,d,rotation,holeX,holeY,logoWidth,logoHeight:logoWidth*WORD_BOX.height/WORD_BOX.width,
    transform:`matrix(${a} ${b} ${c} ${d} ${tx} ${ty})`,
    leafTransform:`matrix(${a/base} ${b/base} ${c/base} ${d/base} ${leafTx} ${leafTy})`,
    projectReveal:smoothProgress((p-.22)/.72),
    opacity:1-smoothProgress((p-.87)/.13)};
}
