import React from 'react';

export interface TLItem {
  id: number;
  group: number;  // 1-4
  start: number;  // seconds
  label: string;
}

const groups = [
  'Boss技能(1)',
  'Boss技能(2)',
  '踏风技能(1)',
  '踏风技能(2)',
];

export const Timeline = ({ items }: { items: TLItem[] }) => {
  const width = 800;
  const rowH = 40;
  const scale = 50; // px per second
  const maxTime = items.reduce((m, i) => Math.max(m, i.start), 0) + 5;

  return (
    <div className="relative" style={{marginLeft:80}}>
      {/* time labels */}
      {Array.from({ length: maxTime + 1 }).map((_, t) => (
        <div key={t} style={{position:'absolute',left:t*scale-10,top:-20,width:20,textAlign:'center',fontSize:12}}>{t}</div>
      ))}
      {/* grid lines */}
      {Array.from({length: maxTime+1}).map((_,t)=>(
        <div key={t} style={{position:'absolute',left:t*scale,top:0,height:rowH*4,width:1,background:'#555'}} />
      ))}
      {/* group labels */}
      {groups.map((g,idx)=>(
        <div key={idx} style={{position:'absolute',top:idx*rowH,left:-80,width:80,height:rowH,lineHeight:`${rowH}px`,textAlign:'right',paddingRight:4}}>{g}</div>
      ))}
      {/* items */}
      <div style={{position:'relative',width:maxTime*scale,height:rowH*4,border:'1px solid #555'}}>
        {items.map(it=> (
          <div key={it.id}
            style={{position:'absolute',left:it.start*scale,top:(it.group-1)*rowH+10,width:40,height:20,background:'#38bdf8',color:'#000',fontSize:12,textAlign:'center',lineHeight:'20px'}}>
            {it.label}
          </div>
        ))}
      </div>
    </div>
  );
};
