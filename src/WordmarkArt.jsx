import React from 'react';
import wordmark from './wordmark.json';

// Stop colors are theme tokens in style.css; offsets stay fixed.
const chromeStops=[['0%','--chrome-0'],['21%','--chrome-21'],['31%','--chrome-31'],['39%','--chrome-39'],['47%','--chrome-47'],['56%','--chrome-56'],['66%','--chrome-31'],['76%','--chrome-76'],['100%','--chrome-0']];

export default function WordmarkArt({reduced}){
  return <>
    <defs>
      <linearGradient id="word-chrome" x1="-160%" y1="0%" x2="100%" y2="40%">
        {chromeStops.map(([offset,token])=><stop key={offset} offset={offset} style={{stopColor:`var(${token})`}}/>)}
        {!reduced&&<><animate attributeName="x1" values="-160%;0%;-160%" dur="22s" calcMode="spline" keyTimes="0;.5;1" keySplines=".42 0 .58 1;.42 0 .58 1" repeatCount="indefinite"/><animate attributeName="x2" values="100%;260%;100%" dur="22s" calcMode="spline" keyTimes="0;.5;1" keySplines=".42 0 .58 1;.42 0 .58 1" repeatCount="indefinite"/></>}
      </linearGradient>
      <clipPath id="word-interior" clipPathUnits="userSpaceOnUse"><path d={wordmark.word}/><path d={wordmark.dot}/></clipPath>
      <filter id="word-inner-glow" x="-5%" y="-10%" width="110%" height="120%" colorInterpolationFilters="sRGB">
        <feGaussianBlur in="SourceAlpha" stdDeviation="1.15" result="soft-alpha"/>
        <feComposite in="SourceAlpha" in2="soft-alpha" operator="out" result="inner-edge"/>
        <feFlood style={{floodColor:'var(--word-glow)'}} floodOpacity=".95" result="light"/>
        <feComposite in="light" in2="inner-edge" operator="in"/>
      </filter>
    </defs>
    <path d={wordmark.word} fill="url(#word-chrome)"/><path d={wordmark.dot} style={{fill:'var(--word-dot)'}}/>
    <g className="word-details" clipPath="url(#word-interior)" fill="none" strokeLinejoin="round" strokeLinecap="round">
      <g fill="#fff" stroke="none" opacity=".7" filter="url(#word-inner-glow)">
        <path d={wordmark.word}/><path d={wordmark.dot}/>
        {!reduced&&<animate attributeName="opacity" values=".58;.82;.58" dur="22s" calcMode="spline" keyTimes="0;.5;1" keySplines=".42 0 .58 1;.42 0 .58 1" repeatCount="indefinite"/>}
      </g>
      <g style={{stroke:'var(--word-edge)'}} strokeWidth=".55" opacity=".38"><path d={wordmark.word}/><path d={wordmark.dot}/></g>
    </g>
  </>;
}
