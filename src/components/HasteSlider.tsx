import React from 'react';

export const HasteSlider = ({ value, onChange }: {
  value: number; onChange:(v:number)=>void;
}) => (
  <div className="my-2">
    <label className="mr-2">Haste Rating {value}</label>
    <input type="range" min={0} max={1500} value={value}
      onChange={e=>onChange(+e.target.value)} />
  </div>
);
