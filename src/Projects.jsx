import React from 'react';
import { ArrowUp } from 'lucide-react';

const projects=[{id:'01',name:'Proje 01'},{id:'02',name:'Proje 02'},{id:'03',name:'Proje 03'}];

export default function Projects({titleRef,onBack}){
  return <section className="projects" aria-labelledby="projects-title">
    <header className="projects-heading">
      <button type="button" className="scene-back" aria-label="wei. ekranına dön" title="Geri dön" onClick={onBack}><ArrowUp size={16} strokeWidth={1.2}/></button>
      <h2 ref={titleRef} id="projects-title" tabIndex={-1}>Projeler</h2>
    </header>
    <ul className="project-list">
      {projects.map((project,index)=><li key={project.id} style={{'--project-index':index}}>
        <article className="project-card" aria-label={`${project.name} · henüz eklenmedi`}>
          <h3>{project.name}</h3><span>Yakında</span>
        </article>
      </li>)}
    </ul>
  </section>;
}
