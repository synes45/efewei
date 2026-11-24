import React, { Suspense, lazy, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Github, Instagram, Mail } from 'lucide-react';
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

function App(){
  const [reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(()=>{const preference=matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(preference.matches);preference.addEventListener('change',update);return()=>preference.removeEventListener('change',update);},[]);
  return <main className="experience">
    <Suspense fallback={<StarryNight/>}><LiquidScene reduced={reduced}/></Suspense>
    <div className="site-noise" aria-hidden="true"/>
    <MotionScene reduced={reduced}/>
    <nav className="socials" aria-label="Sosyal medya ve iletişim">{links.map(({name,url,icon:Icon})=>url?<a key={name} href={url} aria-label={name} title={name} target={url.startsWith('mailto:')?undefined:'_blank'} rel="noopener noreferrer"><Icon size={18} strokeWidth={1.4}/></a>:<span key={name} className="pending-link" aria-label={`${name}: profil adresi henüz eklenmedi`} title={`${name}: profil adresi bekleniyor`}><Icon size={18} strokeWidth={1.4}/></span>)}</nav>
    <AudioToggle/>
  </main>;
}
createRoot(document.getElementById('root')).render(<App/>);
