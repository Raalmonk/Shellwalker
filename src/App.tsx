import React, { useState, useEffect } from 'react';
import { Timeline, TLItem } from './components/Timeline';
import { wwData, WWKey } from './jobs/windwalker';
import { ratingToHaste } from './lib/haste';
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
  const [viewStart, setViewStart] = useState(0);
  // cooldown records for each ability
  interface CDRec { id:number; start:number; base:number; hasted:boolean; end:number; }
  const [cooldowns, setCooldowns] = useState<Record<string, CDRec[]>>({});
  const [nextId, setNextId] = useState(1);
  const [showCD, setShowCD] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

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

  const isOnCD = (key: WWKey, start: number, exclude?: number) => {
    const ability = abilities[key];
    const cds = (cooldowns[key] || []).filter(cd => cd.id !== exclude);
    const maxCharges = key === 'SEF' ? ability.charges ?? 2 : 1;
    const hastePct = ratingToHaste(stats.haste);
    const dur = ['RSK', 'FoF', 'WU'].includes(key)
      ? (ability.cooldown ?? 0) / (1 + hastePct)
      : ability.cooldown ?? 0;
    const end = start + dur;
    const overlaps = cds.filter(cd => start < cd.end && end > cd.start);
    return overlaps.length >= maxCharges;
  };

  // recalc cooldown end times when haste rating changes
  useEffect(() => {
    const hastePct = ratingToHaste(stats.haste);
    setCooldowns(cdObj => {
      const out: Record<string, CDRec[]> = {};
      for (const [k, recs] of Object.entries(cdObj)) {
        out[k] = recs.map(r => {
          const dur = r.hasted ? r.base / (1 + hastePct) : r.base;
          return { ...r, end: r.start + dur };
        });
      }
      return out;
    });
  }, [stats.haste]);

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
    // existing cooldown records for this ability (keep history)
    const cds = cooldowns[key] || [];
    const active = cds.filter(cd => cd.end > now);
    const maxCharges = key === 'SEF' ? ability.charges ?? 2 : 1;
    if (active.length >= maxCharges) {
      alert('cd没转好');
      return;
    }
    const label = key === 'TP'
      ? `<img src="${TPIcon}" alt="${ability.name}" style="width:20px;height:20px"/>`
      : ability.name;
    const group = groupMap[key];
    const id = nextId;
    setNextId(id + 1);
    setItems(it => [...it, { id, group, start: now, label, ability: key }]);
    const baseCd = ability.cooldown ?? 0;
    const hastePct = ratingToHaste(stats.haste);
    const finalCd = ['RSK','FoF','WU'].includes(key)
      ? baseCd / (1 + hastePct)
      : baseCd;
    // store cooldown range so it can be visualised later
    setCooldowns(cdObj => ({
      ...cdObj,
      [key]: [...cds, { id, start: now, base: baseCd, hasted: ['RSK','FoF','WU'].includes(key), end: now + finalCd }],
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
    const cds = (cooldowns[key] || []).filter(cd => cd.start <= time && cd.end > time);
    const maxCharges = key === 'SEF' ? ability.charges ?? 2 : 1;
    if (cds.length < maxCharges) return 'Ready';
    const end = maxCharges === 1
      ? Math.max(...cds.map(cd => cd.end))
      : Math.min(...cds.map(cd => cd.end));
    const remaining = Math.max(
      0,
      Math.ceil(end - time - 1e-6)
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

  const moveItem = (id: number, start: number, end?: number) => {
    const target = items.find(i => i.id === id);
    if (!target) return;
    const abilityKey = target.ability as WWKey | undefined;
    const notReady = abilityKey ? isOnCD(abilityKey, start, id) : false;
    let cls = (target.className || '').replace('warning', '').trim();
    if (notReady) cls = (cls + ' warning').trim();
    const newItem = { ...target, start, end, className: cls };
    setItems(items => [
      ...items.filter(it => it.id !== id),
      newItem,
    ]);
    const hastePct = ratingToHaste(stats.haste);
    setCooldowns(cdObj => {
      const out: Record<string, CDRec[]> = {};
      for (const [k, recs] of Object.entries(cdObj)) {
        const rec = recs.find(r => r.id === id);
        if (!rec) {
          out[k] = recs;
          continue;
        }
        const dur = rec.hasted ? rec.base / (1 + hastePct) : rec.base;
        out[k] = [
          ...recs.filter(r => r.id !== id),
          { ...rec, start, end: start + dur },
        ];
      }
      return out;
    });
  };

  const contextItem = (id: number) => {
    setItems(items => {
      const it = items.find(i => i.id === id);
      if (!it) return items;
      if (it.className === 'highlight') {
        // delete item
        setCooldowns(cdObj => {
          const out: Record<string, CDRec[]> = {};
          for (const [k, recs] of Object.entries(cdObj)) {
            out[k] = recs.filter(r => r.id !== id);
          }
          return out;
        });
        return items.filter(i => i.id !== id);
      } else {
        return items.map(i => i.id === id ? { ...i, className: 'highlight' } : i);
      }
    });
  };

  const selectItem = (id: number) => setSelected(id);

  const snapSelected = () => {
    if (selected == null) return;
    const it = items.find(i => i.id === selected);
    if (!it || !it.ability) return;
    const key = it.ability as WWKey;
    const prev = (cooldowns[key] || [])
      .filter(cd => cd.id !== selected && cd.start < it.start)
      .sort((a, b) => b.start - a.start)[0];
    if (prev) moveItem(selected, prev.end);
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
          onChange={e => { setDuration(+e.target.value); setViewStart(0); }}
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
        <div>Haste Rating: {stats.haste} ({(ratingToHaste(stats.haste) * 100).toFixed(2)}%)</div>
        <div>
          SEF Charges:
          {Math.max(
            0,
            (abilities.SEF.charges ?? 2) -
              (cooldowns['SEF'] || []).filter(cd => cd.start <= time && cd.end > time).length
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

      {selected !== null && (() => {
        const it = items.find(i => i.id === selected);
        const cd = it && cooldowns[it.ability ?? '']?.find(c => c.id === selected);
        if (!it || !cd) return null;
        return (
          <div className="border p-2 space-y-1 text-sm">
            <div>{abilities[it.ability as WWKey].name}</div>
            <label className="block">
              释放时间
              <input
                type="range"
                min={0}
                max={viewStart + duration}
                step={0.1}
                value={it.start}
                onChange={e => moveItem(it.id, +e.target.value)}
                className="w-full"
              />
              <input
                type="number"
                step={0.1}
                value={it.start}
                onChange={e => moveItem(it.id, +e.target.value)}
                className="ml-2 w-20 text-black"
              />
            </label>
            <div>转好时间: {formatTime(cd.end)}</div>
            {(() => {
              const prev = (cooldowns[it.ability ?? ''] || [])
                .filter(c => c.id !== selected && c.start < it.start)
                .sort((a, b) => b.start - a.start)[0];
              return (
                <button
                  onClick={snapSelected}
                  disabled={!prev}
                  className={`px-2 py-1 border rounded ${!prev ? 'opacity-50' : ''}`}
                >
                  On CD
                </button>
              );
            })()}
          </div>
        );
      })()}

      <Timeline
        items={[...items, ...cdBars]}
        start={viewStart}
        end={viewStart + duration}
        cursor={time}
        cds={cdLines}
        showCD={showCD}
        onCursorChange={setTime}
        onRangeChange={(s, e) => {
          setViewStart(s);
          setDuration(e - s);
        }}
        onItemMove={moveItem}
        onItemContext={contextItem}
        onItemClick={selectItem}
      />
    </div>
  );
}