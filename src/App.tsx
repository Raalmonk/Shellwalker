import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from './store';
import { gainChi, spendChi, resetChi, setChi } from './store/chiSlice';
import { Timeline, TLItem } from './components/Timeline';
import { wwData, WWKey } from './jobs/windwalker';
import { ratingToHaste, hasteAt } from './lib/haste';
import { calcDynamicEndTime } from './utils/calcDynamicEndTime';
import { ROW_HEIGHT, ROW_COUNT, HEADER_HEIGHT } from './constants/layout';
import { getEndAt } from './utils/getEndAt';
import { GRID_STEP_MS, } from './constants/time';
import { getNextAvailableCastTime, roundToGridMs } from './utils/timeline';
import { buildTimeline } from './lib/simulator';
import { cdSpeedAt } from './lib/speed';
import { fmt } from './util/fmt';
import { computeBlessingSegments } from './util/blessingSegments';
import { SkillCast } from './types';
import { AbilityIcon } from './components/AbilityIcon';
import { AbilityPalette } from './components/AbilityPalette';
import { ABILITY_ICON_MAP } from './constants/icons';
import { t } from './i18n/en';
import { getOriginalChiCost, getActualChiCost } from './utils/chiCost';

interface CalcBuff {
  id: number;
  key: string;
  start: number;
  end: number;
  label: string;
  group: number;
  src?: number;
  multiplier?: number;
  source?: string;
}

function computeBlessingBuffs(dragons: CalcBuff[]): CalcBuff[] {
  const sorted = [...dragons].sort((a, b) => a.start - b.start);
  let nid = -1000;
  const res: CalcBuff[] = [];
  const add = (start: number, end: number, source: string) => {
    res.push({
      id: nid--,
      key: 'BLG',
      start,
      end,
      label: t('祝福'),
      group: 4,
      multiplier: 1.15,
      source,
    });
  };
  for (const d of sorted) {
    add(d.start, d.end, d.key);
    const tEnd = d.end;
    const active = res.filter(b => b.start <= tEnd && tEnd < b.end);
    const other = active.find(b => b.source !== d.key && b.source !== 'POST');
    if (other) other.end += 4;
    const post = active.find(b => b.source === 'POST');
    if (post) post.end += 4;
    else if (active.length < 3) add(tEnd, tEnd + 4, 'POST');
  }
  return res;
}

function recomputeTimeline(
  rawItems: TLItem[],
  haste: number,
): { items: TLItem[]; buffs: CalcBuff[]; casts: Record<string, SkillCast[]>; chi: number } {
  const abilities = wwData(haste);
  const items = rawItems.map(it => ({ ...it }));
  const abilityItems = items.filter(i => i.ability) as TLItem[];
  abilityItems.sort((a, b) => a.start - b.start);
  let chi = 2;
  let buffs: CalcBuff[] = [];
  let casts: Record<string, SkillCast[]> = {};
  let nid = -1;
  for (const it of abilityItems) {
    const key = it.ability as WWKey;
    const ability = abilities[key];
    const ql = buffs.filter(b => b.key.endsWith('_BD'));
    const blessing = computeBlessingBuffs(ql);
    const end = calcDynamicEndTime(
      it.start,
      ability.cast ?? 0,
      buffs,
      blessing,
      haste,
      key === 'FoF' ? ['AA_BD', 'SW_BD', 'CC_BD'] : [],
    );
    const dur = end - it.start;
    const idx = items.findIndex(x => x.id === it.id);
    if (idx >= 0) items[idx] = { ...items[idx], end: dur > 0 ? it.start + dur : undefined };

    const recs = casts[key] || [];
    const maxCharges = key === 'SEF' ? ability.charges ?? 2 : 1;
    const overlaps = recs.filter(c => {
      const e = getEndAt(c, buffs);
      return it.start < e && e > c.start;
    });
    const notReady = overlaps.length >= maxCharges;
    const sefActiveBuff = buffs.find(b => b.key === 'SEF' && b.end > it.start);
    const lowChi = chi < getActualChiCost(key, buffs, it.start);
    if (idx >= 0) {
      let cls = (items[idx].className || '').replace('warning', '').trim();
      if (notReady || lowChi) cls = (cls + ' warning').trim();
      items[idx] = { ...items[idx], className: cls };
    }

    const origCost = getOriginalChiCost(key);
    const actualCost = getActualChiCost(key, buffs, it.start);
    const chiGain = key === 'TP' ? 2 : key === 'SEF' ? 2 : key === 'BLK_HL' ? 1 : 0;
    if (actualCost > 0) chi = Math.max(0, chi - actualCost);
    chi = Math.min(6, chi + chiGain);

    if (sefActiveBuff && origCost > 0) sefActiveBuff.end += 0.25 * origCost;

    if (key === 'AA') {
      buffs.push({ id: --nid, key: 'AA_BD', start: it.start, end: it.start + 6, label: t('AA青龙'), group: 5, src: it.id });
    } else if (key === 'SW') {
      buffs.push({ id: --nid, key: 'SW_BD', start: it.start + dur, end: it.start + dur + 8, label: t('SW青龙'), group: 5, src: it.id });
    } else if (key === 'CC') {
      const start = it.start + dur;
      buffs = buffs.map(b => (b.key === 'AA_BD' && b.start <= start && start < b.end ? { ...b, end: start } : b));
      buffs.push({ id: --nid, key: 'CC_BD', start, end: start + 6, label: t('CC青龙'), group: 5, src: it.id });
    } else if (key === 'BL') {
      buffs.push({ id: --nid, key: 'BL', start: it.start, end: it.start + 40, label: 'Bloodlust', group: 2, src: it.id, multiplier: 1.3 });
    } else if (key === 'SEF') {
      buffs.push({ id: --nid, key: 'SEF', start: it.start, end: it.start + 15, label: 'SEF', group: 3, src: it.id });
    }

    const hasteMult = (ability as any).affectedByHaste
      ? hasteAt(it.start, [...buffs, ...blessing], haste)
      : 1;
    const cdDur = (ability.cooldown ?? 0) / hasteMult;
    if (key === 'SEF') {
      casts['RSK'] = (casts['RSK'] || []).filter(c => getEndAt(c, buffs) <= it.start);
    }
    casts[key] = [
      ...(casts[key] || []),
      { id: String(it.id), start: it.start, base: cdDur, haste: hasteMult },
    ];
  }
  const total = Math.max(0, ...items.map(i => (i.end ?? i.start)));
  console.log('Recomputed full timeline from 0 to ' + total.toFixed(2) + 's');
  return { items, buffs, casts, chi };
}

export interface BuffRec { key: string; start: number; end: number; multiplier?: number }

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
  interface Buff { id:number; key:string; start:number; end:number; label:string; group:number; src?:number; multiplier?: number; source?: string; }
  const [buffs, setBuffs] = useState<Buff[]>([]);
  const [nextBuffId, setNextBuffId] = useState(-1);

  const containerHeight = ROW_HEIGHT * ROW_COUNT + HEADER_HEIGHT;

  const chi = useSelector((state: RootState) => state.chi.value);
  const dispatch: AppDispatch = useDispatch();

  useEffect(() => {
    dispatch(resetChi());
  }, [dispatch]);

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
    Xuen: 6,
    SEF: 6,
    CC: 6,
    AA: 7,
    SW: 7,
    FoF: 8,
    RSK: 8,
    WU: 8,
    TP: 9,
    BOK: 9,
    SCK: 9,
    SCK_HL: 9,
    BLK_HL: 9,
    BL: 2,
  };

  // handler when an ability button is clicked
  const click = (key: WWKey) => {
    const now = time;
    const ability = abilities[key];

    if (key === 'SEF' && buffs.some(b => b.key === 'SEF' && b.end > now)) {
      alert('风火雷电正在持续');
      return;
    }

    const baseCast = ability.cast ?? 0;

    const originalCost = getOriginalChiCost(key);
    const sefActiveBuff = buffs.find(b => b.key === 'SEF' && b.end > now);
    const actualCost = getActualChiCost(key, buffs, now);
    let chiGain = 0;
    if (key === 'TP') chiGain = 2;
    else if (key === 'SEF') chiGain = 2;
    else if (key === 'BLK_HL') chiGain = 1;

    if (actualCost > 0 && chi < actualCost) {
      alert('Chi不足，无法施放技能');
      return;
    }
    const endTime = calcDynamicEndTime(
      now,
      baseCast,
      buffs,
      blessingBuffs,
      stats.haste,
      key === 'FoF' ? ['AA_BD', 'SW_BD', 'CC_BD'] : [],
    );
    const castDur = endTime - now;
    // existing cooldown records for this ability (keep history)
    const cds = casts[key] || [];
    const active = cds.filter(cd => getEndAt(cd, buffs) > now);
    const maxCharges = key === 'SEF' ? ability.charges ?? 2 : 1;
    if (active.length >= maxCharges) {
      alert(t('cd没转好'));
      return;
    }
    if (isChanneling(now)) {
      alert(t('引导中不能施放其他技能'));
      return;
    }
    const icon = ABILITY_ICON_MAP[key];
    const label = icon
      ? `<img src="${icon.src}" alt="${ability.name}" style="width:10px;height:10px"/>`
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
        type: castDur > 0 ? 'guide' : undefined,
      },
    ]);
    const extraBuffs: Buff[] = [];
    if (key === 'AA') {
      extraBuffs.push({ id: nextBuffId, key: 'AA_BD', start: now, end: now + 6, label: t('AA青龙'), src: id, group: 5 } as any);
      setNextBuffId(nextBuffId - 1);
    } else if (key === 'SW') {
      extraBuffs.push({ id: nextBuffId, key: 'SW_BD', start: now + castDur, end: now + castDur + 8, label: t('SW青龙'), src: id, group: 5 } as any);
      setNextBuffId(nextBuffId - 1);
    } else if (key === 'CC') {
      const start = now + castDur;
      // convert AA buff if active
      setBuffs(bs => bs.map(b =>
        b.key === 'AA_BD' && b.start <= start && start < b.end
          ? { ...b, end: start }
          : b
      ));
      extraBuffs.push({ id: nextBuffId, key: 'CC_BD', start, end: start + 6, label: t('CC青龙'), src: id, group: 5 } as any);
      setNextBuffId(nextBuffId - 1);
    } else if (key === 'BL') {
      extraBuffs.push({ id: nextBuffId, key: 'BL', start: now, end: now + 40, label: 'Bloodlust', group: 2, src: id, multiplier: 1.3 } as any);
      setNextBuffId(nextBuffId - 1);
    } else if (key === 'SEF') {
      extraBuffs.push({ id: nextBuffId, key: 'SEF', start: now, end: now + 15, label: 'SEF', group: 3, src: id } as any);
      setNextBuffId(nextBuffId - 1);
    }

    if (extraBuffs.length) {
      setBuffs(bs => {
        return [...bs, ...extraBuffs];
      });
    }

    let extension = 0;

    if (actualCost > 0) {
      dispatch(spendChi(actualCost));
    }
    if (key === 'BLK_HL') {
      dispatch(gainChi(1));
    } else if (chiGain > 0) {
      dispatch(gainChi(chiGain));
    }
    if (sefActiveBuff && originalCost > 0) {
      extension = 0.25 * originalCost;
      setBuffs(bs =>
        bs.map(b =>
          b.key === 'SEF' && b.end > now ? { ...b, end: b.end + extension } : b
        )
      );
    }

    console.log(
      `[${now.toFixed(3)}s] Cast ${key} → spent ${actualCost} Chi (original ${originalCost})` +
      (extension > 0 ? `, SEF extended by ${extension.toFixed(2)}s` : '') +
      `, Chi now: ${Math.max(0, Math.min(6, chi - actualCost + chiGain))}`
    );


    const baseCd = ability.cooldown ?? 0;
    const hasteMult = (ability as any).affectedByHaste
      ? hasteAt(now, [...buffs, ...blessingBuffs], stats.haste)
      : 1;
    const cdDur = baseCd / hasteMult;
    setCasts(cdObj => {
      const out = { ...cdObj } as Record<string, SkillCast[]>;
      if (key === 'SEF') {
        out['RSK'] = (out['RSK'] || []).filter(cd => getEndAt(cd, buffs) <= now);
      }
      out[key] = [
        ...(cdObj[key] || []),
        {
          id: String(id),
          start: now,
          base: cdDur,
          haste: hasteMult,
        },
      ];
      return out;
    });
    setTime(now + (castDur > 0 ? castDur : key === 'SEF' ? 0.001 : 1));
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

  const blessingBuffs = React.useMemo(() => {
    const dragons = [...qlBuffs].sort((a, b) => a.start - b.start);
    let nid = -1000;
    const res: Buff[] = [];
    const add = (start: number, end: number, source: string) => {
      res.push({
        id: nid--,
        key: 'BLG',
        start,
        end,
        label: t('祝福'),
        group: 4,
        multiplier: 1.15,
        source,
      } as Buff);
    };
    for (const d of dragons) {
      add(d.start, d.end, d.key);
      const t = d.end;
      const active = res.filter(b => b.start <= t && t < b.end);
      const other = active.find(b => b.source !== d.key && b.source !== 'POST');
      if (other) other.end += 4;
      const post = active.find(b => b.source === 'POST');
      if (post) post.end += 4;
      else if (active.length < 3) add(t, t + 4, 'POST');
    }
    return res;
  }, [qlBuffs]);

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
          group: 5,
          start: s,
          end: e,
          label: `${t('青龙')}+${extra.toFixed(2)}cd/s`,
          className: 'buff',
        });
      }
    }
    return res;
  })();

  const blessingItems: TLItem[] = (() => {
    const segs = computeBlessingSegments(blessingBuffs);
    return segs.map((seg, i) => ({
      id: 15000 + i,
      group: 4,
      start: seg.start,
      end: seg.end,
      label: `${seg.stacks}×`,
      className: 'blessing',
      stacks: seg.stacks,
    }));
  })();

  const buffItems: TLItem[] = [
    ...qlItems,
    ...blessingItems,
    ...otherBuffs.map(b => {
      const item: TLItem = {
        id: b.id,
        group: b.group,
        start: b.start,
        end: b.end,
        label: b.label,
        className: b.key === 'SEF' ? 'buff sef-buff' : 'buff',
      };
      if (b.key === 'SEF') {
        const ext = b.end - b.start - 15;
        const msg = `SEF extended by ${ext > 0 ? ext.toFixed(1) : '0'}s from Chi usage`;
        (item as any).title = msg;
      }
      return item;
    }),
  ];

  const hasteItems: TLItem[] = (() => {
    const all = [...buffs, ...blessingBuffs];
    const hs = all.filter(b => b.multiplier);
    const times = Array.from(new Set([
      0,
      ...hs.flatMap(b => [b.start, b.end]),
      viewStart + duration,
    ])).sort((a, b) => a - b);
    const res: TLItem[] = [];
    for (let i = 0; i < times.length - 1; i++) {
      const s = times[i];
      const e = times[i + 1];
      const mult = hasteAt((s + e) / 2, all, stats.haste);
      const lbl = `${mult.toFixed(3).replace(/0+$/,'').replace(/\.$/,'')}×`;
      res.push({
        id: 20000 + i,
        group: 1,
        start: s,
        end: e,
        label: lbl,
        className: 'haste',
        title: lbl,
      });
    }
    return res;
  })();

  useEffect(() => {
    const { items: newItems, buffs: newBuffs, casts: newCasts, chi: newChi } =
      recomputeTimeline(items, stats.haste);
    if (JSON.stringify(newItems) !== JSON.stringify(items)) setItems(newItems);
    setBuffs(newBuffs as any);
    setCasts(newCasts);
    dispatch(setChi(newChi));
  }, [items, stats.haste]);

  useEffect(() => {
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        const el = e.target as HTMLElement;
        if (e.contentRect.width < 24) {
          el.classList.add('hide-text');
        } else {
          el.classList.remove('hide-text');
        }
      }
    });
    const items = document.querySelectorAll('.vis-item.blessing');
    items.forEach(it => ro.observe(it));
    return () => ro.disconnect();
  }, [blessingItems]);

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
    <div className="app-layout">
      <aside className="sidebar p-4 space-y-4">
      <h1 className="text-xl font-bold">{t('踏风排轴器')}</h1>
      <h1 className="text-xl">{t('Boss时间轴选项')}</h1>
      <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="px-2 py-1 border rounded">
        {t('切换')} {theme === 'dark' ? t('浅色') : t('深色')}
      </button>

      <label className="block">
        {t('查看时间范围')} {duration}s
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
        <div>Chi: {chi}</div>
        <div>
          SEF Charges:
          {Math.max(
            0,
            (abilities.SEF.charges ?? 2) -
              (casts['SEF'] || []).filter(c => c.start <= time && getEndAt(c, buffs) > time).length
          )}
        </div>
        <div>{t('时间')}: {formatTime(time)}</div>
      </div>


      <div className="flex gap-2">
        <button onClick={() => setShowCD(!showCD)} className="px-2 py-1 border rounded">
          {showCD ? t('隐藏CD') : t('显示CD')}
        </button>
        <AbilityPalette abilities={abilities} onUse={click} />
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
              {t('释放时间')}
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
            <div>{t('转好时间')}: {formatTime(endAt)}</div>
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
      </aside>
      <main className="timeline-container" style={{ height: containerHeight }}>
        <Timeline
          items={[...hasteItems, ...items, ...buffItems, ...cdBars]}
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
      </main>
    </div>
  );
}