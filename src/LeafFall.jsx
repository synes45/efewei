import React from 'react';

const leaves={
  back:[
    {x:18,size:18,duration:10.8,delay:-2.4,drift:10,tilt:-38,opacity:.46,shape:'maple'},
    {x:46,size:16,duration:12.2,delay:-8.1,drift:-13,tilt:28,opacity:.42,shape:'serrated'},
    {x:71,size:20,duration:11.4,delay:-5.5,drift:-9,tilt:-62,opacity:.5,shape:'maple'}
  ],
  front:[
    {x:28,size:22,duration:10.2,delay:-6.3,drift:13,tilt:16,opacity:.76,shape:'maple'},
    {x:57,size:19,duration:11.8,delay:-1.1,drift:-11,tilt:-48,opacity:.7,shape:'serrated'},
    {x:79,size:17,duration:12.8,delay:-9.5,drift:-15,tilt:42,opacity:.64,shape:'maple'}
  ]
};

const shapes={
  maple:{
    outline:'M24 54 Q21 49 19 44 L10 47 L12 38 L3 33 L10 28 L6 17 L17 21 L19 8 L25 17 L31 3 L33 18 L43 13 L39 26 L47 28 L39 35 L42 42 L31 43 Q28 49 26 54 Z',
    veins:'M25 54 Q25 36 30 9 M26 39 L12 29 M26 43 L38 32 M27 30 L20 17 M25 47 L15 41 M28 30 L37 21',
    fold:'M30 9 Q25 36 25 54 L19 44 L10 47 L12 38 L3 33 L10 28 L6 17 L17 21 L19 8 L25 17 Z'
  },
  serrated:{
    outline:'M24 55 Q18 53 15 48 L17 45 L11 42 L13 38 L9 34 L12 30 L10 26 L15 23 L14 19 L19 16 L19 12 L23 12 L29 3 L31 14 L35 17 L33 21 L39 25 L36 29 L40 34 L36 38 L37 43 L31 46 L30 50 Q27 53 24 55 Z',
    veins:'M24 55 Q22 32 29 8 M24 45 L17 39 M24 39 L33 32 M24 33 L17 27 M25 27 L31 21 M24 48 L30 43 M26 21 L22 17',
    fold:'M29 8 Q22 32 24 55 Q18 53 15 48 L17 45 L11 42 L13 38 L9 34 L12 30 L10 26 L15 23 L14 19 L19 16 L19 12 L23 12 Z'
  }
};

export default function LeafFall({layer,width=113,height=36}){
  const fieldWidth=width+40;
  return <svg className="leaf-vector-layer" x="-20" y={height/2-56} width={fieldWidth} height="112" viewBox={`0 0 ${fieldWidth} 112`} aria-hidden="true" focusable="false">
    {leaves[layer].map((leaf,index)=>{
      const id=`wei-leaf-${layer}-${index}`,shape=shapes[leaf.shape];
      return <g key={id} transform={`translate(${fieldWidth*leaf.x/100} -20)`}>
        <g className="leaf-vector-track" style={{
        '--leaf-duration':`${leaf.duration}s`,'--leaf-delay':`${leaf.delay}s`,
        '--leaf-flutter':`${leaf.duration*.62}s`,'--leaf-opacity':leaf.opacity,
        '--leaf-sway':`${-leaf.drift*.4}px`,'--leaf-drift':`${leaf.drift}px`,
        '--leaf-end':`${leaf.drift*.55}px`,
        '--leaf-tilt':`${leaf.tilt}deg`,'--leaf-turn':`${leaf.tilt+68}deg`
      }}>
        <svg className="leaf-vector-art" width={leaf.size} height={leaf.size*64/48} viewBox="0 0 48 64" focusable="false">
          <defs>
            <linearGradient id={id} x1=".12" y1="0" x2=".88" y2="1">
              <stop offset="0" stopColor="#bc2920"/>
              <stop offset=".48" stopColor="#94151b"/>
              <stop offset="1" stopColor="#420a11"/>
            </linearGradient>
            <clipPath id={`${id}-clip`}><path d={shape.outline}/></clipPath>
          </defs>
          <path d="M25 51 Q23 58 28 63" fill="none" stroke="#783122" strokeWidth="1.3" strokeLinecap="round"/>
          <path d={shape.outline} fill={`url(#${id})`} stroke="#651018" strokeWidth=".6" strokeLinejoin="round"/>
          <g clipPath={`url(#${id}-clip)`}>
            <path d={shape.fold} fill="#e45531" opacity=".14"/>
            <path d={shape.veins} fill="none" stroke="#d36a46" strokeWidth=".7" opacity=".5" strokeLinecap="round"/>
          </g>
        </svg>
        </g>
      </g>;
    })}
  </svg>;
}
