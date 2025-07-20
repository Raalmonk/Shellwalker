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
  // cooldown records for each ability
  const [cooldowns, setCooldowns] = useState<Record<string, {start:number; end:number}[]>>({});
  const [showCD, setShowCD] = useState(false);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };


  useEffect(() => {
    document.body.classList.remove('dark', 'light');
    document.body.classList.add(theme);
  }, [theme]);

  const abilities = wwData(stats.haste);

  // mapping from ability key to timeline group
  const groupMap: Record<WWKey, number> = {
    Xuen: 1,
    SEF: 1,
    CC: 1,
    AA: 2,
    SW: 2,
    FoF: 3,
    RSK: 3,
    WU: 3,
    TP: 4,
    BOK: 4,
  };

  // handler when an ability button is clicked
  const click = (key: WWKey) => {
    const now = time;
    const ability = abilities[key];
    // remaining cooldown records for this ability
    const cds = (cooldowns[key] || []).filter(cd => cd.end > now);
    const maxCharges = key === 'SEF' ? ability.charges ?? 2 : 1;
    if (cds.length >= maxCharges) {
      alert('cd没转好');
      return;
    }
    const label = key === 'TP'
      ? `<img src="${TPIcon}" alt="${ability.name}" style="width:20px;height:20px"/>`
      : ability.name;
    const group = groupMap[key];
    setItems(it => [...it, { id: it.length + 1, group, start: now, label }]);
    const baseCd = ability.cooldown ?? 0;
    const hastePct = stats.haste / 100;
    const finalCd = ['RSK','FoF','WU'].includes(key)
      ? baseCd / (1 + hastePct)
      : baseCd;
    // store cooldown range so it can be visualised later
    setCooldowns(cdObj => ({
      ...cdObj,
      [key]: [...cds, { start: now, end: now + finalCd }],
    }));
    setTime(now + 1);
  };

  // vertical lines showing when a cooldown finishes
  const cdLines = Object.entries(cooldowns)
    .flatMap(([k, recs]) =>
      (recs || [])
        .filter(cd => cd.end > time)
        .map((cd, i) => ({ id: `${k}-${i}`, time: cd.end }))
    );

  // helper to show remaining cooldown next to each ability button
  const cdLabel = (key: WWKey) => {
    const ability = abilities[key];
    const cds = (cooldowns[key] || []).filter(cd => cd.end > time);
    const maxCharges = key === 'SEF' ? ability.charges ?? 2 : 1;
    if (cds.length < maxCharges) return 'Ready';
    const remaining = Math.max(
      0,
      Math.ceil(Math.min(...cds.map(cd => cd.end)) - time - 1e-6)
    );
    return `CD ${remaining}s`;
  };

  // items used to display cooldown ranges on the timeline
  const cdBars: TLItem[] = showCD
    ? Object.entries(cooldowns).flatMap(([k, recs]) =>
        (recs || []).map((cd, i) => ({
          id: `cd-bar-${k}-${i}`,
          group: groupMap[k as WWKey],
          start: cd.start,
          end: cd.end,
          label: '',
          className: 'cd-bar',
        }))
      )
    : [];

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
            <input
              type="number"
              step="0.1"
              value={stats[f]}
              onChange={e => update(f, +e.target.value)}
              className="text-black"
            />
          </label>
        ))}
      </div>

      <div className="space-y-1 text-sm">
        <div>Haste: {stats.haste}% ({(stats.haste / 100).toFixed(2)})</div>
        <div>
          SEF Charges:
          {Math.max(
            0,
            (abilities.SEF.charges ?? 2) -
              (cooldowns['SEF'] || []).filter(cd => cd.end > time).length
          )}
        </div>
        <div>时间: {formatTime(time)}</div>
      </div>


      <div className="flex gap-2">
        <button onClick={() => setShowCD(!showCD)} className="px-2 py-1 border rounded">
          {showCD ? '隐藏CD' : '显示CD'}
        </button>
        {Object.keys(abilities).map(k => (
          <div key={k} className="flex flex-col items-center">
            <button onClick={() => click(k as WWKey)}
              className="px-2 py-1 bg-blue-500 text-white rounded">
              {k === 'TP'
                ? <img src={TPIcon} alt={abilities[k as WWKey].name}
                    className="w-8 h-8" />
                : k}
            </button>
            <span className="text-xs">{cdLabel(k as WWKey)}</span>
          </div>
        ))}
      </div>

      <Timeline
        items={[...items, ...cdBars]}
        duration={duration}
        cursor={time}
        cds={cdLines}
        showCD={showCD}
        onCursorChange={setTime}
      />
    </div>
  );
}