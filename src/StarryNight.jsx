import React from 'react';
import './starryNight.css';

export default function StarryNight() {
  return <div className="starry-night" aria-hidden="true">
    <picture>
      <source media="(max-width: 700px)" srcSet="/textures/starry-night-ink-mobile-v1.webp"/>
      <img src="/textures/starry-night-ink-v1.webp" alt="" width="1600" height="1201" decoding="async" fetchPriority="high" draggable="false"/>
    </picture>
  </div>;
}
