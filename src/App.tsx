import React, { useState } from 'react';
import { HasteSlider } from './components/HasteSlider';
import { ResourceBar } from './components/ResourceBar';
import { Timeline } from './components/Timeline';
import { wwData, WWKey } from './jobs/windwalker';

export default function App() {
  const [haste, setHaste]   = useState(0);
  const [energy, setE]      = useState(100);
  const [chi, setChi]       = useState(0);
  const [queue, setQueue]   = useState<WWKey[]>([]);

  const abilities = wwData(haste);

  const click = (key: WWKey) => {
    const sp = abilities[key];
    setE(e => Math.max(0, e - (sp.power_cost?.energy ?? 0)));
    setChi(c => Math.min(6, c - (sp.power_cost?.chi ?? 0) +
                         (key==='TP'?2:0)));
    setQueue(q => [...q, key]);
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Shellwalker Sandbox</h1>

      <HasteSlider value={haste} onChange={setHaste} />

      <div className="flex gap-2">
        {Object.keys(abilities).map(k =>
          <button key={k} onClick={()=>click(k as WWKey)}
            className="px-2 py-1 bg-blue-500 text-white rounded">{k}</button>
        )}
      </div>

      <ResourceBar energy={energy} chi={chi} />

      <Timeline queue={queue} />
    </div>
  );
}
