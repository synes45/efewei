import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Original, deterministic line art: no painting scan, external assets or runtime animation.
const TAU = Math.PI * 2;
const n = value => Number(value.toFixed(1));
const path = (d, attributes = '') => `<path d="${d}" ${attributes}/>`;
const line = points => points.map(([x, y], i) => `${i ? 'L' : 'M'}${n(x)} ${n(y)}`).join('');
const sample = (count, point) => Array.from({ length: count }, (_, i) => point(i / (count - 1)));

export function starryNight(portrait = false) {
  const w = portrait ? 800 : 1600, h = portrait ? 1200 : 1000;
  const unit = portrait ? .72 : 1;
  const sky = [], stars = [], hills = [], village = [], tree = [];

  // Long, hand-wavering burin cuts follow the current of the night sky.
  for (let row = 0; row < 76; row++) {
    const y = 12 + row * h * .01;
    sky.push(path(line(sample(90, t => {
      const x = t * w;
      const wave = Math.sin(t * 8.2 + row * .048) * 27 * unit;
      const swell = Math.exp(-(((t - .58) / .28) ** 2));
      return [x, y + wave + Math.sin(t * 13.5 + row * .08) * swell * 42 * unit];
    })), `opacity="${n(.12 + .1 * Math.sin(row * .7) ** 2)}"`));
  }

  function vortex(cx, cy, radius, stretch, rotation, count) {
    for (let cut = 0; cut < count; cut++) {
      const points = sample(145, t => {
        const angle = rotation + t * TAU * 1.34;
        const taper = Math.sin(Math.PI * t) ** .65;
        const r = (15 + cut * 2.8 * taper + radius * t) * unit;
        const ripple = Math.sin(t * 70 + cut * .23) * 1.35 * unit;
        return [cx + Math.cos(angle) * (r + ripple) * stretch, cy + Math.sin(angle) * r * .64];
      });
      sky.push(path(line(points), `opacity="${n(.29 + (cut % 5) * .055)}" stroke-width="${cut % 5 === 0 ? 1.5 : .85}"`));
    }
  }
  vortex(w * .55, h * .32, portrait ? 180 : 235, portrait ? 1.2 : 1.62, -1.1, 25);
  vortex(w * .88, h * .51, portrait ? 90 : 120, 1.5, 1.5, 14);

  // Combed ribbons beneath the spiral echo the horizontal cloud in Starry Night.
  for (let cut = 0; cut < 34; cut++) {
    sky.push(path(line(sample(100, t => {
      const x = w * (-.05 + t * 1.1);
      const y = h * .56 + Math.sin(t * 7 - .8) * 43 * unit
        + Math.sin(t * 15 + .5) * 18 * unit + cut * 3.2 * unit;
      return [x, y];
    })), `opacity="${cut % 4 === 0 ? .48 : .24}"`));
  }

  function star(cx, cy, radius, phase) {
    const r = radius * unit;
    stars.push(`<g transform="translate(${n(cx)} ${n(cy)})">`);
    stars.push(`<circle r="${n(r * 1.45)}" fill="#0b0b0b" stroke="none"/>`);
    for (let ring = 0; ring < 12; ring++) {
      const size = r * (.26 + ring * .102);
      stars.push(path(line(sample(60, t => {
        const a = t * TAU;
        const uneven = 1 + Math.sin(a * 5 + phase) * .035 + Math.cos(a * 9 + ring) * .016;
        return [Math.cos(a) * size * uneven, Math.sin(a) * size * uneven * .91];
      })) + 'Z', `opacity="${n(.62 - ring * .026)}" stroke-width="${ring % 3 === 0 ? 1.3 : .8}"`));
    }
    for (let tick = 0; tick < 38; tick++) {
      const a = tick / 38 * TAU, inner = r * 1.51, outer = inner + (4 + Math.sin(tick * 7) * 2) * unit;
      stars.push(path(`M${n(Math.cos(a) * inner)} ${n(Math.sin(a) * inner * .93)}L${n(Math.cos(a) * outer)} ${n(Math.sin(a) * outer * .93)}`, 'opacity=".35"'));
    }
    stars.push(`<circle r="${n(r * .18)}" fill="#b4b4b4" stroke="none" opacity=".7"/></g>`);
  }
  const positions = portrait
    ? [[.14,.12,25],[.48,.075,30],[.8,.26,25],[.19,.39,23],[.52,.51,20],[.88,.6,21],[.1,.64,17]]
    : [[.09,.12,26],[.29,.11,31],[.48,.085,26],[.68,.13,35],[.87,.34,24],[.38,.42,22],[.17,.48,24],[.07,.63,20],[.73,.56,20]];
  positions.forEach(([x,y,r], i) => star(w*x, h*y, r, i));

  const mx = w * (portrait ? .78 : .88), my = h * (portrait ? .105 : .125), mr = (portrait ? 55 : 62) * unit;
  const moon = `M${n(mx + mr * .4)} ${n(my - mr * .92)}A${n(mr)} ${n(mr)} 0 1 0 ${n(mx + mr * .65)} ${n(my + mr * .76)}A${n(mr * .88)} ${n(mr * .88)} 0 0 1 ${n(mx + mr * .4)} ${n(my - mr * .92)}Z`;
  stars.push(`<circle cx="${n(mx)}" cy="${n(my)}" r="${n(mr * 1.36)}" fill="#0b0b0b" stroke="none"/>`);
  for (let ring = 0; ring < 7; ring++) {
    stars.push(`<ellipse cx="${n(mx)}" cy="${n(my)}" rx="${n(mr * (1.05 + ring * .055))}" ry="${n(mr * (1.03 + ring * .055))}" opacity="${n(.45 - ring * .04)}"/>`);
  }
  stars.push(path(moon, 'fill="#919191" stroke="#bdbdbd" stroke-width="1.4"'));
  stars.push(`<g clip-path="url(#moon-cuts)" stroke="#222222" stroke-width="1.1">`);
  for (let cut = -mr; cut < mr; cut += 3.4 * unit) {
    stars.push(path(`M${n(mx - mr)} ${n(my + cut)}q${n(mr)} ${n(-mr * .18)} ${n(mr * 2)} 0`));
  }
  stars.push('</g>');

  // A low, rolling horizon, engraved in parallel rather than shaded with a filter.
  const ridge = t => h * .75 + Math.sin(t * 10 + .4) * 32 * unit + Math.sin(t * 22) * 12 * unit;
  const horizon = line(sample(85, t => [t*w, ridge(t)]));
  hills.push(path(`${horizon}L${w} ${h}H0Z`, 'fill="#101010" stroke="none"'));
  for (let cut = 0; cut < 43; cut++) {
    hills.push(path(line(sample(85, t => [t*w, ridge(t) + cut * 4.2 * unit + Math.sin(t * 19 + cut * .15) * cut * .12])), `opacity="${cut % 5 === 0 ? .44 : .2}"`));
  }

  function house(x, y, width, height, seed, church = false) {
    const roof = height * .42;
    village.push(path(`M${n(x)} ${n(y)}v${n(-height)}l${n(width*.5)} ${n(-roof)}l${n(width*.5)} ${n(roof)}v${n(height)}Z`, 'fill="#111111" stroke="#747474" stroke-width="1"'));
    village.push(path(`M${n(x)} ${n(y-height)}h${n(width)}`, 'opacity=".65"'));
    for (let cut = 4; cut < width; cut += 4) {
      const roofY = -roof * (1 - Math.abs(cut / width * 2 - 1));
      village.push(path(`M${n(x+cut)} ${n(y-height+roofY)}v${n(-roofY)}`, 'opacity=".4" stroke-width=".7"'));
    }
    for (let cut = 5; cut < height; cut += 4.5) {
      village.push(path(`M${n(x+1)} ${n(y-cut)}h${n(width-2)}`, 'opacity=".16" stroke-width=".7"'));
    }
    for (let window = 0; window < (church ? 1 : 2); window++) {
      const wx = x + width * (window ? .65 : .25), wy = y - height * .65;
      village.push(`<rect x="${n(wx)}" y="${n(wy)}" width="${n(width*.11)}" height="${n(height*.2)}" fill="#999999" stroke="none" opacity="${seed % 3 ? .55 : .2}"/>`);
    }
    if (church) {
      const tx = x + width * .5, top = y-height-roof;
      village.push(path(`M${n(tx-width*.16)} ${n(y-height)}V${n(top-height*.5)}L${n(tx)} ${n(top-height*1.45)}L${n(tx+width*.16)} ${n(top-height*.5)}V${n(y-height)}Z`, 'fill="#131313" stroke="#939393" stroke-width="1.1"'));
      village.push(path(`M${n(tx)} ${n(top-height*1.45)}v${n(-height*.2)}m${n(-width*.08)} ${n(height*.07)}h${n(width*.16)}`, 'stroke="#999999" stroke-width="1"'));
    }
  }
  for (let row = 0; row < 3; row++) {
    const count = portrait ? 12 : 23;
    for (let i = 0; i < count; i++) {
      const width = (54 + Math.sin(i*13+row)*16) * unit;
      const x = (i + Math.sin(i*7+row)*.28) / (count-1) * w;
      const y = h * (.88 + row * .057) + Math.sin(i*.8+row)*15*unit;
      house(x, y, width, (35 + Math.cos(i*4+row)*11)*unit, i+row);
    }
  }
  house(w * .61, h * .9, 43*unit, 53*unit, 1, true);

  // The tall, flame-shaped cypress is the foreground anchor of the composition.
  const tx = w * (portrait ? .12 : .16), base = h * 1.04;
  const tw = (portrait ? 110 : 155) * unit, th = h * (portrait ? .53 : .87);
  const treePath = `M${n(tx-tw)} ${n(base)}C${n(tx-tw*1.2)} ${n(base-th*.2)} ${n(tx-tw*.48)} ${n(base-th*.31)} ${n(tx-tw*.68)} ${n(base-th*.49)}C${n(tx-tw*.7)} ${n(base-th*.57)} ${n(tx-tw*.15)} ${n(base-th*.64)} ${n(tx-tw*.25)} ${n(base-th*.79)}Q${n(tx+tw*.03)} ${n(base-th*.72)} ${n(tx+tw*.04)} ${n(base-th)}C${n(tx+tw*.38)} ${n(base-th*.82)} ${n(tx+tw*.11)} ${n(base-th*.7)} ${n(tx+tw*.39)} ${n(base-th*.61)}Q${n(tx+tw*.78)} ${n(base-th*.49)} ${n(tx+tw*.5)} ${n(base-th*.4)}C${n(tx+tw*1.07)} ${n(base-th*.3)} ${n(tx+tw*.73)} ${n(base-th*.13)} ${n(tx+tw*1.15)} ${n(base)}Z`;
  tree.push(path(treePath, 'fill="#080808" stroke="#777777" stroke-width="1.3"'));
  tree.push('<g clip-path="url(#cypress-cuts)">');
  for (let cut = 0; cut < 65; cut++) {
    const x = tx - tw + cut / 64 * tw * 2.15;
    tree.push(path(line(sample(65, t => [x + Math.sin(t*13+cut*.15)*tw*.13 + Math.sin(t*27+cut*.6)*tw*.045, base-t*th])), `opacity="${cut % 4 === 0 ? .48 : .23}" stroke-width="${cut % 4 === 0 ? 1.2 : .75}"`));
  }
  tree.push('</g>');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" fill="none">
<title>Yıldızlı Gece — monokrom gravür yorumu</title>
<defs><clipPath id="moon-cuts">${path(moon)}</clipPath><clipPath id="cypress-cuts">${path(treePath)}</clipPath></defs>
<path fill="#0b0b0b" d="M0 0H${w}V${h}H0Z"/>
<g stroke="#ababab" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
${sky.join('\n')}
${stars.join('\n')}
${hills.join('\n')}
${village.join('\n')}
${tree.join('\n')}
</g></svg>\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const target = new URL('../public/textures/', import.meta.url);
  await mkdir(target, { recursive: true });
  await Promise.all([
    writeFile(new URL('starry-night-engraving.svg', target), starryNight()),
    writeFile(new URL('starry-night-engraving-portrait.svg', target), starryNight(true)),
  ]);
  console.log('Monokrom gravür: masaüstü ve dikey kompozisyonlar oluşturuldu.');
}
