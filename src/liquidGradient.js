// Liquid-gradient WebGL2 port. Reference: EditorStation's public Framer
// Liquid Gradient component. No Framer runtime, page assets or tracking scripts.
// Site settings: seed 558, speed .16, scale .72, amplitude 1,
// frequency .1, definition 6, bands 1, exposure/contrast 1.1.
// Original coordinate spread, with only a small increase in reflection coverage.
// Color math uses the standard Oklab/OKLCH transforms and PCG hash.
export const liquidGradient=`
precision highp float;
precision highp int;
uniform float uTime;
uniform vec2 uResolution;
uniform sampler2D uInk;
uniform float uInkReady;
uniform vec2 uInkScale;
uniform vec2 uInkCenter;
uniform vec2 uInkParallax;
uniform float uTheme;
in vec2 vUv;
out vec4 fragColor;

uvec3 pcg(uvec3 v){
  v=v*1664525u+1013904223u;
  v.x+=v.y*v.z;v.y+=v.z*v.x;v.z+=v.x*v.y;
  v^=v>>16u;
  v.x+=v.y*v.z;v.y+=v.z*v.x;v.z+=v.x*v.y;
  return v;
}
vec3 seeded(float seed){
  return vec3(pcg(uvec3(floatBitsToUint(seed),floatBitsToUint(seed*1.5+7.31),floatBitsToUint(seed*2.7+13.37))))/float(0xFFFFFFFFu);
}
vec3 lab(vec3 c){
  vec3 lms=pow(max(vec3(dot(c,vec3(.4122214708,.5363325363,.0514459929)),dot(c,vec3(.2119034982,.6806995451,.1073969566)),dot(c,vec3(.0883024619,.2817188376,.6299787005))),0.),vec3(1./3.));
  return vec3(dot(lms,vec3(.2104542553,.7936177850,-.0040720468)),dot(lms,vec3(1.9779984951,-2.4285922050,.4505937099)),dot(lms,vec3(.0259040371,.7827717662,-.8086757660)));
}
vec3 rgb(vec3 c){
  vec3 lms=vec3(c.x+.3963377774*c.y+.2158037573*c.z,c.x-.1055613458*c.y-.0638541728*c.z,c.x-.0894841775*c.y-1.2914855480*c.z);
  lms=lms*lms*lms;
  return vec3(dot(lms,vec3(4.0767416621,-3.3077115913,.2309699292)),dot(lms,vec3(-1.2684380046,2.6097574011,-.3413193965)),dot(lms,vec3(-.0041960863,-.7034186147,1.7076147010)));
}
vec3 lch(vec3 c){return vec3(c.x,length(c.yz),atan(c.z,c.y));}
vec3 fromLch(vec3 c){return vec3(c.x,c.y*cos(c.z),c.y*sin(c.z));}
vec3 colorAt(int i){
  if(i==0)return vec3(0.);
  // Muted burgundy reflections, rather than bright saturated crimson.
  if(i==1)return vec3(84./255.,31./255.,42./255.);
  return vec3(140./255.,53./255.,68./255.);
}
vec3 palette(float value){
  float segment=clamp(value,0.,1.)*5.;int i=min(int(floor(segment)),4);
  vec3 a=lch(lab(pow(colorAt(i),vec3(2.2))));
  vec3 b=lch(lab(pow(colorAt(i+1),vec3(2.2))));
  if(a.y<.05)a.z=b.z;if(b.y<.05)b.z=a.z;
  float angle=b.z-a.z;
  if(angle>3.14159265)angle-=6.28318530;
  if(angle< -3.14159265)angle+=6.28318530;
  float f=clamp(segment-float(i),0.,1.);
  return rgb(fromLch(vec3(mix(a.xy,b.xy,f),a.z+angle*f)));
}
vec3 gamut(vec3 c){
  if(min(c.r,min(c.g,c.b))>=0.&&max(c.r,max(c.g,c.b))<=1.)return c;
  vec3 v=lch(lab(max(c,0.)));v.x=clamp(v.x,0.,1.);
  float maximum=.4*(1.-pow(abs(2.*v.x-1.),2.));
  if(v.y>maximum*.7){float knee=maximum*.7;v.y=knee+(maximum-knee)*tanh((v.y-knee)/(maximum-knee+.001));}
  return clamp(rgb(fromLch(v)),0.,1.);
}
// Photoshop/W3C Soft Light with white ink: black stays black, no gray is added.
vec3 softLightWhite(vec3 base){
  vec3 low=((16.*base-12.)*base+4.)*base;
  return mix(low,sqrt(max(base,0.)),step(vec3(.25),base));
}
void main(){
  vec2 p=(vUv*2.-1.)*vec2(uResolution.x/uResolution.y,1.);
  vec3 seed=seeded(558.),secondary=seeded(658.);
  float angle=558.*2.3999632;
  p=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*p;
  vec2 q=p*.72;
  vec2 phase=(secondary.xy-.5)*6.28318530;
  float a=phase.x,d=phase.y,t=uTime*.3*.16;
  // Framer inverts this control before applying the warp: .1 -> 10.
  const float frequency=1./.1;
  for(int j=2;j<6;j++){
    float f=float(j);
    q+=sin(q.yx/frequency*f+t+vec2(a,d)+seed.xy*f)/f;
    a+=cos(f+d*1.2+q.x*2.-t+secondary.z);
    d+=sin(f*q.y+a+seed.z+t+secondary.y);
  }
  // With Jellify off, all layers share the same warp: evaluate it once.
  float phaseValue=length(q.yx+vec2(a,d)*.2)+seed.x;
  float value=((.5+.5*sin(phaseValue+1.))*.5+(.5+.5*sin(phaseValue+4.))+(.5+.5*sin(phaseValue+9.))*.5)/2.;
  // Keep genuine black negative space: burgundy belongs to local reflections only.
  value=max((value-.28)/.4,0.);
  // Preserve faint reflections, but softly compress peaks below the red plateau.
  // Zero stays zero: this adds no screen-wide burgundy floor.
  float tone=.32*(1.-exp(-value/.32));
  vec3 color=palette(tone)*1.1;
  vec3 adjusted=lab(color);adjusted.x=clamp((adjusted.x-.5)*1.1+.5,0.,1.);
  color=gamut(rgb(adjusted));
  // Real pen marks are part of this material, not a screen-space image overlay.
  // The original liquid field drives both their refraction and reflected light.
  vec2 inkUv=(vUv-.5)*uInkScale+uInkCenter;
  inkUv+=uInkParallax*uInkScale;
  inkUv+=vec2(sin(q.y*1.7+t),cos(q.x*1.5-t))*.004*uInkScale;
  // Soft Light keeps full-strength ink integrated without adding a gray veil.
  const float inkStrength=1.;
  float ink=texture(uInk,inkUv).a*uInkReady*inkStrength;
  float nearby=texture(uInk,inkUv+vec2(.0008,-.0008)).a*uInkReady*inkStrength;
  float reflection=smoothstep(.05,.85,value);
  float inkAmount=clamp(ink*(.45+.55*reflection)+(ink-nearby)*.12,0.,1.);
  vec3 surface=pow(clamp(color,0.,1.),vec3(1./2.2));
  vec3 blended=mix(surface,softLightWhite(surface),inkAmount);
  // Fade the final display color: gamma and Soft Light cannot brighten it again.
  float lowerVisibility=mix(.025,1.,smoothstep(.16,.48,vUv.y));
  vec3 result=blended*lowerVisibility;
  // Light theme (uTheme 0..1 crossfade): the same field and ink tint warm paper
  // toward blush, then muted ruby at the peaks. Dark output is untouched at 0.
  if(uTheme>0.){
    const vec3 paper=vec3(246.,241.,239.)/255.;
    float peak=tone/.32;
    vec3 light=mix(paper,vec3(232.,190.,196.)/255.,smoothstep(0.,.55,peak));
    light=mix(light,vec3(150.,58.,76.)/255.,smoothstep(.45,1.,peak)*.75);
    // Ink darkens (multiply-like) instead of lightening; like dark mode, it shows
    // mostly inside reflections and stays faint on bare paper.
    light=mix(light,light*vec3(.62,.5,.53),inkAmount*(.3+.5*reflection));
    result=mix(result,mix(paper,light,lowerVisibility),uTheme);
  }
  fragColor=vec4(result,1.);
}
`;
