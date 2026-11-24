import { PARALLAX_GAIN, SWAY_LIMITS } from './inkParallax.js';

export const INK_ASPECT=1600/1201;
export const inkTexturePath=width=>`/textures/starry-night-ink${width<=700?'-mobile':''}-v1.webp`;

// Cover, never contain: every screen pixel samples the drawing, without stretching.
// Reserve just enough overscan for both the ink refraction and opposite parallax.
export function inkViewport(width,height,aspect=INK_ASPECT){
  if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0||!Number.isFinite(aspect)||aspect<=0)throw new RangeError('Invalid ink viewport');
  const ratio=width/height;
  const margin=.006+Math.max(SWAY_LIMITS[0]*PARALLAX_GAIN/width,SWAY_LIMITS[1]*PARALLAX_GAIN/height);
  const overscan=.998/(1+2*margin);
  return {
    scale:[Math.min(1,ratio/aspect)*overscan,Math.min(1,aspect/ratio)*overscan],
    center:[ratio<.75?.43:.5,.5],
  };
}
