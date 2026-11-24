import React, { Suspense, lazy, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Github, Instagram, Mail, Moon, Sun } from 'lucide-react';
import './style.css';
import './fonts.css';
import './motionScene.css';
import './leafFall.css';
import './noise.css';
import AudioToggle from './AudioToggle.jsx';
import MotionScene from './MotionScene.jsx';
import StarryNight from './StarryNight.jsx';

const LiquidScene=lazy(()=>import('./LiquidScene.jsx'));
const links=[{name:'Instagram',url:'https://www.instagram.com/efe.jsx/',icon:Instagram},{name:'GitHub',url:'https://github.com/synes45',icon:Github},{name:'E-posta · efe@efewei.space',url:'mailto:efe@efewei.space',icon:Mail}];
// Keep in sync with the inline theme script in index.html.
const themeColors={dark:'#000000',light:'#f6f1ef'};
const systemLight=matchMedia('(prefers-color-scheme: light)');
const savedTheme=()=>{try{const value=localStorage.getItem('theme');return value==='light'||value==='dark'?value:null;}catch{return null;}};

function App(){
  const [reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(()=>{const preference=matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(preference.matches);preference.addEventListener('change',update);return()=>preference.removeEventListener('change',update);},[]);
  const [theme,setTheme]=useState(()=>document.documentElement.dataset.theme==='light'?'light':'dark');
  // Follow the system only until the user picks a theme.
  useEffect(()=>{const update=()=>{if(!savedTheme())setTheme(systemLight.matches?'light':'dark');};systemLight.addEventListener('change',update);return()=>systemLight.removeEventListener('change',update);},[]);
  // The big surface (WebGL) crossfades in LiquidScene; UI colors switch instantly to avoid a global transition.
  useEffect(()=>{document.documentElement.dataset.theme=theme;document.querySelector('meta[name="theme-color"]')?.setAttribute('content',themeColors[theme]);},[theme]);
  const toggleTheme=()=>{const next=theme==='light'?'dark':'light';try{localStorage.setItem('theme',next);}catch{}setTheme(next);};
  const themeLabel=theme==='light'?'Koyu temaya geç':'Açık temaya geç';
  return <main className="experience">
    <Suspense fallback={<StarryNight/>}><LiquidScene reduced={reduced} theme={theme}/></Suspense>
    <div className="site-noise" aria-hidden="true"/>
    <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label={themeLabel} title={themeLabel}>{theme==='light'?<Moon size={18} strokeWidth={1.4}/>:<Sun size={18} strokeWidth={1.4}/>}</button>
    <MotionScene reduced={reduced}/>
    <nav className="socials" aria-label="Sosyal medya ve iletişim">{links.map(({name,url,icon:Icon})=>url?<a key={name} href={url} aria-label={name} title={name} target={url.startsWith('mailto:')?undefined:'_blank'} rel="noopener noreferrer"><Icon size={18} strokeWidth={1.4}/></a>:<span key={name} className="pending-link" aria-label={`${name}: profil adresi henüz eklenmedi`} title={`${name}: profil adresi bekleniyor`}><Icon size={18} strokeWidth={1.4}/></span>)}</nav>
    <AudioToggle/>
  </main>;
}
createRoot(document.getElementById('root')).render(<App/>);
