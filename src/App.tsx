import React, { useState } from 'react';
import { Timeline, TLItem } from './components/Timeline';
import { wwData, WWKey } from './jobs/windwalker';

export default function App() {
  const [stats, setStats] = useState({
    crit: 0,
    haste: 0,
    versa: 0,
    mastery: 0,
  });
  const [items, setItems] = useState<TLItem[]>([]);
  const [time, setTime] = useState(0);

  const abilities = wwData(stats.haste);

  const click = (key: WWKey) => {
    setItems(it => [...it, { id: it.length+1, group: 3, start: time, label: key }]);
    setTime(t => t + 1);
  };

  const update = (field: string, value: number) =>
    setStats(s => ({ ...s, [field]: value }));

  return (
    <div className="p-4 space-y-4 text-white">
      <h1 className="text-xl font-bold">踏风排轴器</h1>

      <div className="flex gap-4">
        {(['crit','haste','versa','mastery'] as const).map(f => (
          <label key={f} className="flex flex-col text-sm">
            {f}
            <input type="number" value={stats[f]} onChange={e=>update(f, +e.target.value)} className="text-black" />
          </label>
        ))}
      </div>

      <div className="flex gap-2">
        {Object.keys(abilities).map(k =>
          <button key={k} onClick={()=>click(k as WWKey)}
            className="px-2 py-1 bg-blue-500 text-white rounded">{k}</button>
        )}
      </div>

      <Timeline items={items} />
    </div>
  );
}
