import React from 'react';
import { ArrowUp } from 'lucide-react';

// image is optional; alt is required whenever image is set.
const projects=[{id:'01',name:'Proje 01'},{id:'02',name:'Proje 02',image:'/projects/placeholder-02.svg',alt:'Soyut bordo yer tutucu görsel'},{id:'03',name:'Proje 03'}];

export default function Projects({titleRef,onBack}){
  return <section className="projects" aria-labelledby="projects-title">
    <header className="projects-heading">
      <button type="button" className="scene-back" aria-label="wei. ekranına dön" title="Geri dön" onClick={onBack}><ArrowUp size={16} strokeWidth={1.2}/></button>
      <h2 ref={titleRef} id="projects-title" tabIndex={-1}>Projeler</h2>
    </header>
    <ul className="project-list">
      {projects.map((project,index)=><li key={project.id} style={{'--project-index':index}}>
        <article className="project-card" aria-label={`${project.name} · henüz eklenmedi`}>
          {project.image&&<img className="project-media" src={project.image} alt={project.alt} width="320" height="180" decoding="async"/>}
          <div className="project-row"><h3>{project.name}</h3><span>Yakında</span></div>
        </article>
      </li>)}
    </ul>
  </section>;
}
