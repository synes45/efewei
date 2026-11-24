import React from 'react';
import wordmark from './wordmark.json';

export default function WordmarkArt({reduced}){
  return <>
    <defs>
      <linearGradient id="word-chrome" x1="-160%" y1="0%" x2="100%" y2="40%">
        <stop offset="0%" stopColor="#fff6f5"/><stop offset="21%" stopColor="#f5d6d6"/><stop offset="31%" stopColor="#e8a6ad"/><stop offset="39%" stopColor="#ffe4e2"/><stop offset="47%" stopColor="#ffffff"/><stop offset="56%" stopColor="#f3c2c8"/><stop offset="66%" stopColor="#e8a6ad"/><stop offset="76%" stopColor="#f9d8da"/><stop offset="100%" stopColor="#fff6f5"/>
        {!reduced&&<><animate attributeName="x1" values="-160%;0%;-160%" dur="22s" repeatCount="indefinite"/><animate attributeName="x2" values="100%;260%;100%" dur="22s" repeatCount="indefinite"/></>}
      </linearGradient>
      <clipPath id="word-interior" clipPathUnits="userSpaceOnUse"><path d={wordmark.word}/><path d={wordmark.dot}/></clipPath>
      <filter id="word-inner-glow" x="-5%" y="-10%" width="110%" height="120%" colorInterpolationFilters="sRGB">
        <feGaussianBlur in="SourceAlpha" stdDeviation="1.15" result="soft-alpha"/>
        <feComposite in="SourceAlpha" in2="soft-alpha" operator="out" result="inner-edge"/>
        <feFlood floodColor="#fff0ed" floodOpacity=".95" result="light"/>
        <feComposite in="light" in2="inner-edge" operator="in"/>
      </filter>
    </defs>
    <path d={wordmark.word} fill="url(#word-chrome)"/><path d={wordmark.dot} fill="#ffe1df"/>
    <g className="word-details" clipPath="url(#word-interior)" fill="none" strokeLinejoin="round" strokeLinecap="round">
      <g fill="#fff" stroke="none" opacity=".7" filter="url(#word-inner-glow)">
        <path d={wordmark.word}/><path d={wordmark.dot}/>
        {!reduced&&<animate attributeName="opacity" values=".58;.82;.58" dur="22s" repeatCount="indefinite"/>}
      </g>
      <g stroke="#fff3f0" strokeWidth=".55" opacity=".38"><path d={wordmark.word}/><path d={wordmark.dot}/></g>
    </g>
  </>;
}
