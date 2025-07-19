import React, { useState, useEffect } from 'react';
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
  const [group, setGroup] = useState(3);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [duration, setDuration] = useState(45);

  useEffect(() => {
    document.body.classList.remove('dark', 'light');
    document.body.classList.add(theme);
  }, [theme]);

  const abilities = wwData(stats.haste);

  const click = (key: WWKey) => {
    setItems(it => [...it, { id: it.length + 1, group, start: time, label: key }]);
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

      <label className="flex items-center gap-2">
        Track:
        <select value={group} onChange={e => setGroup(+e.target.value)} className="text-black">
          <option value={1}>Boss技能(1)</option>
          <option value={2}>Boss技能(2)</option>
          <option value={3}>踏风技能(1)</option>
          <option value={4}>踏风技能(2)</option>
        </select>
      </label>

      <div className="flex gap-2">
        {Object.keys(abilities).map(k =>
          <button key={k} onClick={()=>click(k as WWKey)}
            className="px-2 py-1 bg-blue-500 text-white rounded">{k}</button>
        )}
      </div>

      <Timeline items={items} duration={duration} />
    </div>
  );
}
