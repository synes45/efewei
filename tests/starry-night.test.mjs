import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { execFileSync } from 'node:child_process';
import { starryNight } from '../scripts/generate-starry-night.mjs';
import { inkViewport, inkTexturePath, INK_ASPECT } from '../src/starryNightMapping.js';
import { liquidGradient } from '../src/liquidGradient.js';
import { inkParallax, wordmarkOffset, PARALLAX_GAIN, SWAY_LIMITS, SWAY_PERIOD } from '../src/inkParallax.js';

for (const portrait of [false, true]) {
  const name = portrait ? 'portrait' : 'landscape';
  const filename = `starry-night-engraving${portrait ? '-portrait' : ''}.svg`;

  test(`${name}: archived procedural SVG matches its deterministic source`, async () => {
    const svg = starryNight(portrait);
    assert.equal(await readFile(new URL(`../public/textures/${filename}`, import.meta.url), 'utf8'), svg);
    assert.match(svg, portrait ? /viewBox="0 0 800 1200"/ : /viewBox="0 0 1600 1000"/);
    assert.ok(Buffer.byteLength(svg) < 550_000, 'Static illustration must stay lightweight');
    assert.doesNotMatch(svg, /NaN|Infinity|undefined/);
  });

  test(`${name}: every ink and paper shade is strictly monochrome`, () => {
    const colors = [...starryNight(portrait).matchAll(/#[\da-f]{6}/g)].map(([hex]) => hex.slice(1));
    assert.ok(colors.length > 10);
    for (const color of colors) {
      assert.equal(color.slice(0, 2), color.slice(2, 4));
      assert.equal(color.slice(2, 4), color.slice(4, 6));
    }
  });

  test(`${name}: self-contained, static line art needs no WebGL or remote resources`, () => {
    const svg = starryNight(portrait);
    assert.doesNotMatch(svg, /<(?:script|image|animate|filter|foreignObject)\b|\bhref=/);
    assert.ok((svg.match(/<path /g) || []).length > 500);
    assert.match(svg, /clip-path="url\(#moon-cuts\)"/);
    assert.match(svg, /clip-path="url\(#cypress-cuts\)"/);
  });
}

test('normal rendering uses the liquid shader, not a separate artwork overlay', async () => {
  const main = await readFile(new URL('../src/main.jsx', import.meta.url), 'utf8');
  assert.match(main, /lazy\(\(\)=>import\('\.\/LiquidScene\.jsx'\)\)/);
  assert.match(main, /<LiquidScene reduced=\{reduced\} theme=\{theme\}\/>/);
  assert.match(main, /<Suspense fallback=\{<StarryNight\/>\}>/);
  assert.doesNotMatch(main, /<\/Suspense>\s*<StarryNight\/>/);
  const scene = await readFile(new URL('../src/LiquidScene.jsx', import.meta.url), 'utf8');
  assert.match(scene, /fallback\|\|artFallback\?<StarryNight\/>:null/);
  assert.match(scene, /uniforms\.uInk\.value=texture;uniforms\.uInkReady\.value=1;mapInk\(\);dirty=true/);
  assert.match(scene, /artwork\.dispose\(\);emptyInk\.dispose\(\)/);
});

test('active artwork uses the real downloaded drawing, not the procedural SVG', async () => {
  const component = await readFile(new URL('../src/StarryNight.jsx', import.meta.url), 'utf8');
  const css = await readFile(new URL('../src/starryNight.css', import.meta.url), 'utf8');
  assert.match(component, /starry-night-ink-v1\.webp/);
  assert.match(component, /starry-night-ink-mobile-v1\.webp/);
  assert.doesNotMatch(component, /engraving.*\.svg/);
  assert.doesNotMatch(css, /background\s*:|::after|\.experience\s*\{/);
  assert.match(css, /pointer-events:none/);
  assert.match(css, /object-fit:cover/);
  assert.doesNotMatch(css, /height:auto|mask-image|translate\(|object-fit:contain/);
});

test('cover mapping fills tall phones and wide screens without stretching or exposing image edges', () => {
  for (const [width,height] of [[320,240],[320,932],[360,640],[390,844],[430,932],[844,390],[1440,900],[2560,1080]]) {
    const {scale,center}=inkViewport(width,height);
    assert.ok(Math.abs(scale[0]*INK_ASPECT/width-scale[1]/height)<1e-12, 'Drawing must keep its aspect ratio');
    assert.ok(Math.max(...scale)>.9&&Math.max(...scale)<1, 'Minimal overscan with safe motion margins');
    for(const x of [0,1])for(const y of [0,1]){
      for(const axis of [0,1]){
        const uv=([x,y][axis]-.5)*scale[axis]+center[axis];
        const refraction=(.004+SWAY_LIMITS[axis]*PARALLAX_GAIN/[width,height][axis])*scale[axis]+.0008;
        assert.ok(uv-refraction>0&&uv+refraction<1, `${width}×${height}: no blank image borders`);
      }
    }
  }
});

test('responsive texture selection matches the fallback and invalid dimensions are rejected', () => {
  assert.equal(inkTexturePath(390),'/textures/starry-night-ink-mobile-v1.webp');
  assert.equal(inkTexturePath(1440),'/textures/starry-night-ink-v1.webp');
  assert.throws(()=>inkViewport(0,800),RangeError);
  assert.throws(()=>inkViewport(390,NaN),RangeError);
});

test('ink refraction and engraved lighting share the original liquid field', () => {
  assert.match(liquidGradient, /uniform sampler2D uInk/);
  assert.match(liquidGradient, /\(vUv-\.5\)\*uInkScale\+uInkCenter/);
  assert.match(liquidGradient, /sin\(q\.y\*1\.7\+t\),cos\(q\.x\*1\.5-t\)/);
  assert.match(liquidGradient, /reflection=smoothstep\(\.05,\.85,value\)/);
  assert.match(liquidGradient, /mix\(surface,softLightWhite\(surface\),inkAmount\)/);
});

test('Photoshop-style soft light preserves black instead of adding a gray veil', async () => {
  assert.match(liquidGradient, /vec3 low=\(\(16\.\*base-12\.\)\*base\+4\.\)\*base/);
  assert.match(liquidGradient, /mix\(low,sqrt\(max\(base,0\.\)\),step\(vec3\(\.25\),base\)\)/);
  assert.doesNotMatch(liquidGradient, /vec3\(max\(relief|color\+vec3\(/);
  const css=await readFile(new URL('../src/starryNight.css', import.meta.url), 'utf8');
  // Dark theme value lives in the :root token block.
  assert.match(css, /mix-blend-mode:var\(--ink-blend\)/);
  const tokens=await readFile(new URL('../src/style.css', import.meta.url), 'utf8');
  assert.match(tokens, /:root\{--bg:#050102;[^}]*--ink-blend:soft-light;/);
});

test('soft-light ink and its bevel use full strength without the old 35% reduction', async () => {
  assert.match(liquidGradient, /const float inkStrength=1\./);
  assert.match(liquidGradient, /float ink=.*uInkReady\*inkStrength/);
  assert.match(liquidGradient, /float nearby=.*uInkReady\*inkStrength/);
  const css=await readFile(new URL('../src/starryNight.css', import.meta.url), 'utf8');
  assert.match(css, /opacity:var\(--ink-opacity\)/);
  const tokens=await readFile(new URL('../src/style.css', import.meta.url), 'utf8');
  assert.match(tokens, /:root\{--bg:#050102;[^}]*--ink-opacity:\.18;/);
});

test('liquid spread keeps true black negative space instead of a screen-wide burgundy floor', () => {
  assert.match(liquidGradient, /vec2\(uResolution\.x\/uResolution\.y,1\.\)/);
  assert.match(liquidGradient, /vec2 q=p\*\.72/);
  assert.match(liquidGradient, /value=max\(\(value-\.28\)\/\.4,0\.\)/);
  assert.match(liquidGradient, /vec3 color=palette\(tone\)\*1\.1/);
  assert.match(liquidGradient, /if\(i==0\)return vec3\(0\.\)/);
  assert.doesNotMatch(liquidGradient, /palette\(mix\(|value=smoothstep\(\.10,\.78,value\)/);
  assert.doesNotMatch(liquidGradient, /uResolution\/min\(uResolution/);
});

test('ink parallax follows the logo CSS keyframes in the opposite screen direction', async () => {
  const css=await readFile(new URL('../src/motionScene.css',import.meta.url),'utf8');
  assert.match(css,/animation:portal-sway 9s ease-in-out infinite/);
  const anchors=[[0,0],[2.5,-5],[-2,-1],[1.5,3.5],[0,0]];
  for(let i=0;i<anchors.length;i++)assert.deepEqual(wordmarkOffset(i*SWAY_PERIOD/4),anchors[i]);
  for(let time=0;time<SWAY_PERIOD;time+=125){
    const [x,y]=wordmarkOffset(time);
    const [px,py]=inkParallax(time,390,844);
    assert.ok(Math.abs(-px*390+x*PARALLAX_GAIN)<1e-10);
    assert.ok(Math.abs(py*844+y*PARALLAX_GAIN)<1e-10);
    assert.ok(Math.abs(x)<=SWAY_LIMITS[0]&&Math.abs(y)<=SWAY_LIMITS[1]);
  }
  assert.deepEqual(inkParallax(2250,390,844,true),[0,0]);
  assert.deepEqual(inkParallax(null,390,844),[0,-0]);
});

test('parallax reuses the real CSS animation clock and the existing render loop', async () => {
  const scene=await readFile(new URL('../src/LiquidScene.jsx',import.meta.url),'utf8');
  assert.match(scene,/getAnimations/);
  assert.match(scene,/swayRef\.current\?\.currentTime/);
  assert.match(scene,/reducedRef\.current\)/);
  assert.match(liquidGradient,/inkUv\+=uInkParallax\*uInkScale/);
  assert.doesNotMatch(scene,/getComputedStyle|setInterval/);
});

test('the lower edge is dimmed and the loading surface has no red radial glow', async () => {
  assert.match(liquidGradient,/vec3 blended=mix\(surface,softLightWhite\(surface\),inkAmount\)/);
  assert.match(liquidGradient,/lowerVisibility=mix\(\.025,1\.,smoothstep\(\.16,\.48,vUv\.y\)\)/);
  assert.match(liquidGradient,/vec3 result=blended\*lowerVisibility;/);
  assert.doesNotMatch(liquidGradient,/color\*=mix\(\.32/);
  const css=await readFile(new URL('../src/style.css',import.meta.url),'utf8');
  assert.match(css,/\.experience\{background:var\(--bg\)\}/);
  assert.match(css,/:root\{--bg:#050102;/);
  assert.match(css,/\.liquid-fallback:after\{opacity:\.08;/);
});

test('liquid peaks roll off below the flat red plateau while black stays black', () => {
  assert.match(liquidGradient,/float tone=\.32\*\(1\.-exp\(-value\/\.32\)\)/);
  const tone=value=>.32*(1-Math.exp(-value/.32));
  assert.equal(tone(0),0);
  assert.ok(tone(.01)>.0098, 'Faint reflections should not be globally dimmed');
  for(const value of [.05,.1,.2,.4,.8,1,2,4]){
    assert.ok(tone(value)<.4, 'Never reach the original constant bright-red palette segment');
    assert.ok(tone(value)<=value);
  }
  assert.ok(tone(2)-tone(1)<tone(.2)-tone(.1), 'Peak highlights compress smoothly');
});

test('only the liquid slows down; logo and opposite parallax keep their original clock', async () => {
  assert.match(liquidGradient,/t=uTime\*\.3\*\.16/);
  assert.equal(SWAY_PERIOD,9000);
  const css=await readFile(new URL('../src/style.css',import.meta.url),'utf8');
  assert.match(css,/animation-duration:77s/);
  assert.match(css,/animation-delay:-38\.5s/);
});

test('both real-artwork textures contain monochrome ink and transparent paper', () => {
  const result = execFileSync('python3', ['scripts/prepare-starry-night.py', '--check'], {
    cwd: new URL('../', import.meta.url), encoding: 'utf8',
  });
  assert.match(result, /OK starry-night-ink-v1.webp/);
  assert.match(result, /OK starry-night-ink-mobile-v1.webp/);
});
