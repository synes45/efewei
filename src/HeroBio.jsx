import React, { useEffect, useState } from 'react';

export const HERO_BIO = 'Graphic Design · AI Integration · Web Development';
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#%&*+<>/[]{}=';
const LOCK_START = 520;
const LOCK_STEP = 22;
const NOISE_TICK = 50;

export default function HeroBio({ reduced }) {
  const chars = Array.from(HERO_BIO);
  const [locked, setLocked] = useState(() => reduced ? chars.length : 0);
  const [noise, setNoise] = useState(0);

  useEffect(() => {
    if (reduced) {
      setLocked(chars.length);
      return;
    }
    const start = performance.now();
    const lockTimer = setInterval(() => {
      const count = Math.min(chars.length, Math.max(0, Math.floor((performance.now() - start - LOCK_START) / LOCK_STEP)));
      setLocked(count);
      if (count >= chars.length) {
        clearInterval(lockTimer);
        clearInterval(noiseTimer);
      }
    }, LOCK_STEP);
    const noiseTimer = setInterval(() => setNoise(value => value + 1), NOISE_TICK);
    return () => { clearInterval(lockTimer); clearInterval(noiseTimer); };
  }, [reduced, chars.length]);

  return <p className="hero-bio">
    <span className="screen-reader-only">{HERO_BIO}</span>
    <span className="hero-bio-text" aria-hidden="true">{chars.map((char, index) => {
      const resolved = index < locked;
      // Deterministic noise keeps the layout stable and avoids per-frame randomness in render.
      const glyph = GLYPHS[(index * 29 + noise * 17) % GLYPHS.length];
      const shown = char === ' ' ? '\u00A0' : resolved ? char : glyph;
      return <span key={index} className={`hero-bio-char${resolved ? ' is-locked' : ''}`} style={{ '--char-index': index }}>{shown}</span>;
    })}</span>
  </p>;
}
