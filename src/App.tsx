import React, { useState, useEffect } from 'react';
import { Timeline, TLItem } from './components/Timeline';
import { wwData, WWKey } from './jobs/windwalker';
import TPIcon from './Pics/TP.jpg';

export default function App() {
  const [stats, setStats] = useState({
    crit: 0,
    haste: 0,
    versa: 0,
    mastery: 0,
  });
  const [items, setItems] = useState<TLItem[]>([]);
  const [time, setTime] = useState(0);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [duration, setDuration] = useState(45);


  useEffect(() => {
    document.body.classList.remove('dark', 'light');
    document.body.classList.add(theme);
  }, [theme]);

  const abilities = wwData(stats.haste);

  const groupMap: Record<WWKey, number> = {
    Xuen: 1,
    SEF: 1,
    AA: 2,
    SW: 2,
    FoF: 3,
    RSK: 3,
    WU: 3,
    TP: 4,
    BOK: 4,
  };

  const click = (key: WWKey) => {
    const ability = abilities[key];
    const label = key === 'TP'
      ? `<img src="${TPIcon}" alt="${ability.name}" style="width:20px;height:20px"/>`
      : ability.name;
    const group = groupMap[key];
    setItems(it => [...it, { id: it.length + 1, group, start: time, label }]);
    setTime(t => t + 1);
  };

  const update = (field: string, value: number) =>
    setStats(s => ({ ...s, [field]: value }));

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">踏风排轴器</h1>
      <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="px-2 py-1 border rounded">
        切换 {theme === 'dark' ? '浅色' : '深色'}
      </button>

      <label className="block">
        查看时间范围 {duration}s
        <input
          type="range" min={45} max={600}
          value={duration}
          onChange={e => setDuration(+e.target.value)}
          className="w-full"
        />
      </label>


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
            className="px-2 py-1 bg-blue-500 text-white rounded">
            {k === 'TP'
              ? <img src={TPIcon} alt={abilities[k as WWKey].name}
                  className="w-8 h-8" />
              : k}
          </button>
        )}
      </div>

      <Timeline items={items} duration={duration} />
    </div>
  );
}