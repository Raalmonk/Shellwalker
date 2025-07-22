import React, { useState, useEffect } from 'react';
import { Timeline, TLItem } from './components/Timeline';
import { wwData, WWKey } from './jobs/windwalker';
import { ratingToHaste } from './lib/haste';
import { getEndAt } from './utils/getEndAt';
import { GRID_STEP_MS, } from './constants/time';
import { getNextAvailableCastTime, roundToGridMs } from './utils/timeline';
import { buildTimeline } from './lib/simulator';
import { cdSpeedAt } from './lib/speed';
import { fmt } from './util/fmt';
import { SkillCast } from './types';
import TPIcon from './Pics/TP.jpg';

export interface BuffRec { key: string; start: number; end: number }

export function hasteAt(
  _t: number,
  _buffs: BuffRec[] = [],
  hasteRating = 0,
): number {
  return ratingToHaste(hasteRating);
}

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
  const [casts, setCasts] = useState<Record<string, SkillCast[]>>({});
  const [nextId, setNextId] = useState(1);
  const [showCD, setShowCD] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  interface Buff { id:number; key:string; start:number; end:number; label:string; group:number; src?:number; }
  const [buffs, setBuffs] = useState<Buff[]>([]);
  const [nextBuffId, setNextBuffId] = useState(-1);

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

  const timeline = React.useMemo(() => buildTimeline(casts, buffs), [casts, buffs]);

  const buffsAt = (t: number, extra: Buff[] = []) =>
    [...buffs, ...extra].filter(b => t >= b.start && t < b.end);


  const fofModAt = (t: number, extra: Buff[] = []) => {
    const list = buffsAt(t, extra).map(b => b.key);
    const hasAA = list.includes('AA_BD');
    const hasSW = list.includes('SW_BD');
    const hasCC = list.includes('CC_BD');
    if (hasSW && (hasAA || hasCC)) return 0.25;
    if (hasAA || hasSW || hasCC) return 0.5;
    return 1;
  };

  const isOnCD = (key: WWKey, start: number, exclude?: number) => {
    const ability = abilities[key];
    const recs = (casts[key] || []).filter(c => c.id !== String(exclude));
    const maxCharges = key === 'SEF' ? ability.charges ?? 2 : 1;
    const overlaps = recs.filter(c => {
      const end = getEndAt(c, buffs);
      return start < end && end > c.start;
    });
    return overlaps.length >= maxCharges;
  };

  // check if any channel is active at given time
  const isChanneling = (start: number, exclude?: number) =>
    items.some(it => it.id !== exclude && it.end !== undefined && start < it.end && start >= it.start);



  // mapping from ability key to timeline group
  const groupMap: Record<WWKey, number> = {
    Xuen: 4,
    SEF: 4,
    CC: 4,
    AA: 5,
    SW: 5,
    FoF: 6,
    RSK: 6,
    WU: 6,
    TP: 7,
    BOK: 7,
  };

  // handler when an ability button is clicked
  const click = (key: WWKey) => {
    const now = time;
    const ability = abilities[key];
    const castDurBase = ability.castEff ?? 0;
    const castDur = key === 'FoF'
      ? castDurBase * fofModAt(now)
      : castDurBase;
    // existing cooldown records for this ability (keep history)
    const cds = casts[key] || [];
    const active = cds.filter(cd => getEndAt(cd, buffs) > now);
    const maxCharges = key === 'SEF' ? ability.charges ?? 2 : 1;
    if (active.length >= maxCharges) {
      alert('cd没转好');
      return;
    }
    if (isChanneling(now)) {
      alert('引导中不能施放其他技能');
      return;
    }
    const label = key === 'TP'
      ? `<img src="${TPIcon}" alt="${ability.name}" style="width:20px;height:20px"/>`
      : ability.name;
    const group = groupMap[key];
    const id = nextId;
    setNextId(id + 1);
    setItems(it => [
      ...it,
      {
        id,
        group,
        start: now,
        end: castDur > 0 ? now + castDur : undefined,
        label,
        ability: key,
        pendingDelete: false,
      },
    ]);
    const extraBuffs: Buff[] = [];
    if (key === 'AA') {
      extraBuffs.push({ id: nextBuffId, key: 'AA_BD', start: now, end: now + 6, label: 'AA青龙', src: id, group: 3 } as any);
      setNextBuffId(nextBuffId - 1);
    } else if (key === 'SW') {
      extraBuffs.push({ id: nextBuffId, key: 'SW_BD', start: now + castDur, end: now + castDur + 8, label: 'SW青龙', src: id, group: 3 } as any);
      setNextBuffId(nextBuffId - 1);
    } else if (key === 'CC') {
      const start = now + castDur;
      // convert AA buff if active
      setBuffs(bs => bs.map(b =>
        b.key === 'AA_BD' && b.start <= start && start < b.end
          ? { ...b, end: start }
          : b
      ));
      extraBuffs.push({ id: nextBuffId, key: 'CC_BD', start, end: start + 6, label: 'CC青龙', src: id, group: 3 } as any);
      setNextBuffId(nextBuffId - 1);
    }

    if (extraBuffs.length) {
      setBuffs(bs => {
        return [...bs, ...extraBuffs];
      });
    }

    const baseCd = ability.cooldown ?? 0;
    setCasts(cdObj => ({
      ...cdObj,
      [key]: [
        ...cds,
        {
          id: String(id),
          start: now,
          base: baseCd,
        },
      ],
    }));
    setTime(now + (castDur > 0 ? castDur : 1));
  };

  // vertical lines showing when a cooldown finishes
  const cdLines = Object.entries(timeline)
    .flatMap(([k, recs]) =>
      recs
        .map((c, i) => (c.end > time ? { id: `${k}-${i}`, time: c.end } : null))
        .filter(Boolean) as TLItem[]
    );

  // helper to show remaining cooldown next to each ability button
  const cdLabel = (key: WWKey) => {
    const ability = abilities[key];
    const cds = (timeline[key] || []).filter(c => c.start <= time && c.end > time);
    const maxCharges = key === 'SEF' ? ability.charges ?? 2 : 1;
    if (cds.length < maxCharges) return 'Ready';
    const end = maxCharges === 1
      ? Math.max(...cds.map(c => c.end))
      : Math.min(...cds.map(c => c.end));
    const remaining = fmt(end - time);
    return `CD ${remaining}s`;
  };

  // items used to display cooldown ranges on the timeline
  const cdBars: TLItem[] = showCD
    ? Object.entries(timeline).flatMap(([k, recs]) =>
        recs.map((c, i) => ({
          id: `cd-bar-${k}-${i}`,
          group: groupMap[k as WWKey],
          start: c.start,
          end: c.end,
          label: '',
          className: 'cd-bar',
        }))
      )
    : [];

  const qlBuffs = buffs.filter(b => b.key.endsWith('_BD'));
  const otherBuffs = buffs.filter(b => !b.key.endsWith('_BD'));

  const qlItems: TLItem[] = (() => {
    const times = Array.from(new Set(qlBuffs.flatMap(b => [b.start, b.end]))).sort((a, b) => a - b);
    const res: TLItem[] = [];
    for (let i = 0; i < times.length - 1; i++) {
      const s = times[i];
      const e = times[i + 1];
      const extra = cdSpeedAt((s + e) / 2, buffs) - 1;
      if (extra > 0) {
        res.push({
          id: 10000 + i,
          group: 3,
          start: s,
          end: e,
          label: `青龙+${extra.toFixed(2)}cd/s`,
          className: 'buff',
        });
      }
    }
    return res;
  })();

  const buffItems: TLItem[] = [
    ...qlItems,
    ...otherBuffs.map(b => ({
      id: b.id,
      group: b.group,
      start: b.start,
      end: b.end,
      label: b.label,
      className: 'buff',
    })),
  ];

  const moveItem = (id: number, start: number, end?: number) => {
    const target = items.find(i => i.id === id);
    const abilityKey = target?.ability as WWKey | undefined;
    const prevDur = target && target.end ? target.end - target.start : 0;
    const snapStart = roundToGridMs(start * 1000) / 1000;
    let finalStart = snapStart;
    if (abilityKey) {
      finalStart = getNextAvailableCastTime(
        abilityKey,
        snapStart,
        { casts, buffs },
        String(id),
      );
    }
    const newEnd = end ?? (target && target.end ? finalStart + prevDur : undefined);
    const notReady = abilityKey ? isOnCD(abilityKey, finalStart, id) : false;
    const channelling = isChanneling(finalStart, id);
    setItems(items => items.map(it => {
      if (it.id !== id) return it;
      let cls = (it.className || '').replace('warning', '').trim();
      if (notReady || channelling) cls = (cls + ' warning').trim();
      return { ...it, start: finalStart, end: newEnd, className: cls };
    }));
    const delta = finalStart - (target?.start || 0);
    setBuffs(bs => bs.map(b => b.src === id ? { ...b, start: b.start + delta, end: b.end + delta } : b));
    setCasts(cs => {
      const out: Record<string, SkillCast[]> = {};
      for (const [k, recs] of Object.entries(cs)) {
        out[k] = recs.map(r => (r.id !== String(id) ? r : { ...r, start: finalStart }));
      }
      return out;
    });
  };

  const contextItem = (id: number) => {
    setItems(items => {
      const it = items.find(i => i.id === id);
      if (!it) return items;
      if (it.pendingDelete) {
        // delete item
        setCasts(cs => {
          const out: Record<string, SkillCast[]> = {};
          for (const [k, recs] of Object.entries(cs)) {
            out[k] = recs.filter(r => r.id !== String(id));
          }
          return out;
        });
        setBuffs(bs => bs.filter(b => b.src !== id));
        return items.filter(i => i.id !== id);
      } else {
        return items.map(i =>
          i.id === id ? { ...i, pendingDelete: true, className: 'highlight' } : i
        );
      }
    });
  };

  const selectItem = (id: number) => {
    setItems(items =>
      items.map(it =>
        it.id === id && it.pendingDelete
          ? { ...it, pendingDelete: false, className: it.className?.replace('highlight', '').trim() }
          : it,
      ),
    );
    setSelected(id);
  };

  const snapSelected = () => {
    if (selected == null) return;
    const it = items.find(i => i.id === selected);
    if (!it || !it.ability) return;
    const key = it.ability as WWKey;
    const prev = (casts[key] || [])
      .filter(cd => cd.id !== String(selected) && cd.start < it.start)
      .sort((a, b) => b.start - a.start)[0];
    if (prev) moveItem(selected, getEndAt(prev, buffs));
  };

  const update = (field: string, value: number) =>
    setStats(s => ({ ...s, [field]: value }));

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">踏风排轴器</h1>
      <h1 className="text-xl">Boss时间轴选项</h1>
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
              (casts['SEF'] || []).filter(c => c.start <= time && getEndAt(c, buffs) > time).length
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
        const cd = it && casts[it.ability ?? '']?.find(c => c.id === String(selected));
        if (!it || !cd) return null;
        const endAt = getEndAt(cd, buffs);
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
            <div>转好时间: {formatTime(endAt)}</div>
            {(() => {
              const prev = (casts[it.ability ?? ''] || [])
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
        items={[...items, ...buffItems, ...cdBars]}
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