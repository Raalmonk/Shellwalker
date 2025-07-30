import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from './store';
import { gainChi, spendChi, resetChi, setChi } from './store/chiSlice';
import { Timeline, TLItem } from './components/Timeline';
import { wwData, WWKey } from './jobs/windwalker';
import { ratingToHaste, hasteAt } from './lib/haste';
import { calcDynamicEndTime } from './utils/calcDynamicEndTime';
import { getEndAt } from './utils/getEndAt';
import { GRID_STEP_MS, } from './constants/time';
import { getNextAvailableCastTime, roundToGridMs } from './utils/timeline';
import { buildTimeline } from './lib/simulator';
import { cdSpeedAt } from './lib/speed';
import { cdProgress } from './lib/cooldown';
import { fmt } from './util/fmt';
import { computeBlessingSegments } from './util/blessingSegments';
import { computeAcclamationSegments } from './util/acclamationSegments';
import { SkillCast } from './types';
import { AbilityIcon } from './components/AbilityIcon';
import { AbilityPalette } from './components/AbilityPalette';
import { ABILITY_ICON_MAP } from './constants/icons';
import { t } from './i18n/en';
import { getOriginalChiCost, getActualChiCost } from './utils/chiCost';
import { exportSimcApl } from './utils/simcApl';
import { downloadText } from './utils/download';

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
      group: 8,
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
    const dur = ability.affectedByHaste
      ? calcDynamicEndTime(
          it.start,
          ability.cast ?? 0,
          buffs,
          blessing,
          haste,
          key === 'FoF' ? ['AA_BD', 'SW_BD', 'CC_BD'] : [],
        ) - it.start
      : ability.cast ?? 0;
    const isGCD = ability.triggersGCD ?? true;
    const duration = dur > 0 ? dur : isGCD ? 1 : 0;
    const idx = items.findIndex(x => x.id === it.id);
    if (idx >= 0) {
      const cls = items[idx].className || '';
      const baseCls = cls.split(' ').filter(Boolean);
      if (!baseCls.includes(key)) baseCls.push(key);
      items[idx] = {
        ...items[idx],
        end: duration > 0 ? it.start + duration : undefined,
        type: duration > 0 ? 'guide' : undefined,
        ...(ability.cast ? { title: duration > 0 ? `Cast Duration: ${duration.toFixed(1)}s` : undefined } : {}),
        className: baseCls.join(' '),
      };
    }

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
    const chiGain = key === 'TP'
      ? 2
      : key === 'SEF'
        ? 2
        : key === 'BOK_HL' || key === 'RSK_HL'
          ? 1
          : 0;
    if (actualCost > 0) chi = Math.max(0, chi - actualCost);
    chi = Math.min(6, chi + chiGain);

    if (sefActiveBuff && origCost > 0) sefActiveBuff.end += 0.25 * origCost;

    if (key === 'AA') {
      buffs.push({ id: --nid, key: 'AA_BD', start: it.start, end: it.start + 6, label: t('AA青龙'), group: 9, src: it.id });
    } else if (key === 'SW') {
      buffs.push({ id: --nid, key: 'SW_BD', start: it.start + dur, end: it.start + dur + 8, label: t('SW青龙'), group: 9, src: it.id });
    } else if (key === 'CC') {
      const start = it.start + dur;
      buffs = buffs.map(b => (b.key === 'AA_BD' && b.start <= start && start < b.end ? { ...b, end: start } : b));
      buffs.push({ id: --nid, key: 'CC_BD', start, end: start + 6, label: t('CC青龙'), group: 9, src: it.id });
    } else if (key === 'BL') {
      buffs.push({ id: --nid, key: 'BL', start: it.start, end: it.start + 40, label: 'Bloodlust', group: 6, src: it.id, multiplier: 1.3 });
    } else if (key === 'SEF') {
      buffs.push({ id: --nid, key: 'SEF', start: it.start, end: it.start + 15, label: 'SEF', group: 4, src: it.id });
    } else if (key === 'RSK' || key === 'RSK_HL') {
      buffs.push({ id: --nid, key: 'Acclamation', start: it.start, end: it.start + 12, label: 'Acclamation', group: 5, src: it.id });
    } else if (key === 'Xuen') {
      buffs.push({ id: --nid, key: 'Xuen', start: it.start, end: it.start + 20, label: 'Xuen', group: 3, src: it.id, multiplier: 1.15 });
    }

    const hasteMult = (ability as any).affectedByHaste
      ? hasteAt(it.start, [...buffs, ...blessing], haste)
      : 1;
    const cdDur = (ability.cooldown ?? 0) / hasteMult;
    if (key === 'SEF') {
      casts['RSK'] = (casts['RSK'] || []).filter(c => getEndAt(c, buffs) <= it.start);
      casts['RSK_HL'] = (casts['RSK_HL'] || []).filter(c => getEndAt(c, buffs) <= it.start);
      console.log('SEF triggered cooldown reset on RSK and RSK_HL');
      if (!casts['RSK_HL']) {
        console.warn('RSK_HL not found for cooldown reset triggered by SEF');
      }
    }
    if (key === 'BOK' || key === 'BOK_HL') {
      const reduction = cdSpeedAt(it.start, buffs);
      let fofReduced = 0;
      let rskReduced = 0;
      const applyReduce = (
        list: SkillCast[] = [],
        track: (diff: number) => void,
      ) =>
        list
          .map(cd => {
            const end = getEndAt(cd, buffs);
            if (end <= it.start) return cd;
            const newEnd = Math.max(it.start, end - reduction);
            track(end - newEnd);
            if (newEnd <= cd.start) return null;
            const newBase = cdProgress(cd.start, newEnd, buffs, cdSpeedAt);
            return { ...cd, base: newBase };
          })
          .filter(Boolean) as SkillCast[];
      casts['FoF'] = applyReduce(casts['FoF'], d => (fofReduced += d));
      const rsk = applyReduce(casts['RSK'], d => (rskReduced += d));
      casts['RSK'] = rsk;
      casts['RSK_HL'] = rsk;
      if (idx >= 0) {
        items[idx] = {
          ...items[idx],
          title: `FoF -${fofReduced.toFixed(1)}s, RSK -${rskReduced.toFixed(1)}s`,
        };
      }
    }
    const rec = { id: String(it.id), start: it.start, base: cdDur, haste: hasteMult };
    casts[key] = [...(casts[key] || []), rec];
    if (key === 'RSK_HL') {
      casts['RSK'] = [...(casts['RSK'] || []), rec];
    } else if (key === 'RSK') {
      casts['RSK_HL'] = [...(casts['RSK_HL'] || []), rec];
    }
  }
  const total = Math.max(0, ...items.map(i => (i.end ?? i.start)));
  console.log('Recomputed full timeline from 0 to ' + total.toFixed(1) + 's');
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
  const [autoAdjustMsg, setAutoAdjustMsg] = useState('');
  const [compactViewMode, setCompactViewMode] = useState(false);

  const PRESET_PREFIX = 'shellwalker_presets:';
  const [presetName, setPresetName] = useState('');
  const [presetList, setPresetList] = useState<string[]>([]);
  const [selectedPreset, setSelectedPreset] = useState('');
  const [bossUrl, setBossUrl] = useState('');
  interface BossTimeline { name:string; phases:{label:string; start:number}[]; timeline:{start:number; icon:string; label:string}[]; }
  const [bossData, setBossData] = useState<BossTimeline | null>(null);

  const chi = useSelector((state: RootState) => state.chi.value);
  const dispatch: AppDispatch = useDispatch();

  useEffect(() => {
    dispatch(resetChi());
  }, [dispatch]);

  const formatTime = (sec: number) => {
    return `${sec.toFixed(1)}s`;
  };


  useEffect(() => {
    document.body.classList.remove('dark', 'light');
    document.body.classList.add(theme);
  }, [theme]);

  const updatePresetList = () => {
    const names: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(PRESET_PREFIX)) {
        names.push(key.slice(PRESET_PREFIX.length));
      }
    }
    setPresetList(names);
  };

  const loadBoss = async (url: string) => {
    if (!url) return;
    try {
      const res = await fetch(url);
      const data = await res.json();
      setBossData(data);
      setBossUrl(url);
    } catch (e) {
      alert('无法加载 Boss 时间轴文件');
      setBossData(null);
    }
  };

  const savePreset = () => {
    if (!presetName) return;
    const data = {
      items: items.filter(it => it.ability),
      stats,
      duration,
      viewStart,
      nextId,
      nextBuffId,
      bossTimelineFile: bossUrl,
    };
    localStorage.setItem(
      PRESET_PREFIX + presetName,
      JSON.stringify(data),
    );
    updatePresetList();
  };

  const loadPreset = () => {
    if (!selectedPreset) return;
    const json = localStorage.getItem(PRESET_PREFIX + selectedPreset);
    if (!json) return;
    const data = JSON.parse(json);
    setStats(data.stats || stats);
    setItems(data.items || []);
    setDuration(data.duration ?? 45);
    setViewStart(data.viewStart ?? 0);
    setNextId(data.nextId ?? (data.items ? Math.max(0, ...data.items.map((it: TLItem) => it.id)) + 1 : 1));
    setNextBuffId(data.nextBuffId ?? -1);
    if (data.bossTimelineFile) loadBoss(data.bossTimelineFile);
  };

  const deletePreset = () => {
    if (!selectedPreset) return;
    localStorage.removeItem(PRESET_PREFIX + selectedPreset);
    setSelectedPreset('');
    updatePresetList();
  };

  useEffect(() => {
    updatePresetList();
  }, []);

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
    Xuen: 10,
    SEF: 10,
    CC: 10,
    AA: 11,
    SW: 11,
    FoF: 12,
    RSK: 12,
    RSK_HL: 12,
    WU: 12,
    TP: 13,
    BOK: 13,
    SCK: 13,
    SCK_HL: 13,
    BOK_HL: 13,
    BL: 6,
  };

  // handler when an ability button is clicked
  const click = (key: WWKey) => {
    const now = time;
    let startTime = now;
    while (isChanneling(startTime)) {
      const conflicts = items.filter(
        it => it.end !== undefined && startTime < it.end && startTime >= it.start,
      );
      if (!conflicts.length) break;
      startTime = Math.max(...conflicts.map(it => it.end!));
    }
    if (startTime !== now) {
      setAutoAdjustMsg(t('释放时间已自动调整至可用时间'));
      setTimeout(() => setAutoAdjustMsg(''), 2000);
    }
    const ability = abilities[key];

    if (key === 'SEF' && buffs.some(b => b.key === 'SEF' && b.end > startTime)) {
      alert('风火雷电正在持续');
      return;
    }

    const baseCast = ability.cast ?? 0;

    const originalCost = getOriginalChiCost(key);
    const sefActiveBuff = buffs.find(b => b.key === 'SEF' && b.end > startTime);
    const actualCost = getActualChiCost(key, buffs, startTime);
    let chiGain = 0;
    if (key === 'TP') chiGain = 2;
    else if (key === 'SEF') chiGain = 2;
    else if (key === 'BOK_HL' || key === 'RSK_HL') chiGain = 1;

    if (actualCost > 0 && chi < actualCost) {
      alert('Chi不足，无法施放技能');
      return;
    }
    const castDur = ability.affectedByHaste
      ? calcDynamicEndTime(
          startTime,
          baseCast,
          buffs,
          blessingBuffs,
          stats.haste,
          key === 'FoF' ? ['AA_BD', 'SW_BD', 'CC_BD'] : [],
        ) - startTime
      : baseCast;
    const isGCD = ability.triggersGCD ?? true;
    const duration = castDur > 0 ? castDur : isGCD ? 1 : 0;
    const itemType = castDur > 0 ? 'guide' : isGCD ? 'gcd' : undefined;
    // existing cooldown records for this ability (keep history)
    const cds = casts[key] || [];
    const active = cds.filter(cd => getEndAt(cd, buffs) > startTime);
    const maxCharges = key === 'SEF' ? ability.charges ?? 2 : 1;
    if (active.length >= maxCharges) {
      alert(t('cd没转好'));
      return;
    }
    if (isChanneling(startTime)) {
      alert(t('引导中不能施放其他技能'));
      return;
    }
    const icon = ABILITY_ICON_MAP[key];
    const label = icon
      ? `<div class="timeline-event-icon"><img src="${icon.src}" alt="${ability.name}" /></div>`
      : ability.name;
    const group = groupMap[key];
    const id = nextId;
    setNextId(id + 1);
    setItems(it => [
      ...it,
      {
        id,
        group,
        start: startTime,
        end: duration > 0 ? startTime + duration : undefined,
        label,
        ability: key,
        className: key,
        ...(castDur > 0 ? { title: `Cast Duration: ${castDur.toFixed(1)}s` } : {}),
        pendingDelete: false,
        type: itemType,
      },
    ]);
    const extraBuffs: Buff[] = [];
    if (key === 'AA') {
      extraBuffs.push({ id: nextBuffId, key: 'AA_BD', start: startTime, end: startTime + 6, label: t('AA青龙'), src: id, group: 9 } as any);
      setNextBuffId(nextBuffId - 1);
    } else if (key === 'SW') {
      extraBuffs.push({ id: nextBuffId, key: 'SW_BD', start: startTime + castDur, end: startTime + castDur + 8, label: t('SW青龙'), src: id, group: 9 } as any);
      setNextBuffId(nextBuffId - 1);
    } else if (key === 'CC') {
      const start = startTime + castDur;
      // convert AA buff if active
      setBuffs(bs => bs.map(b =>
        b.key === 'AA_BD' && b.start <= start && start < b.end
          ? { ...b, end: start }
          : b
      ));
      extraBuffs.push({ id: nextBuffId, key: 'CC_BD', start, end: start + 6, label: t('CC青龙'), src: id, group: 9 } as any);
      setNextBuffId(nextBuffId - 1);
    } else if (key === 'BL') {
      extraBuffs.push({ id: nextBuffId, key: 'BL', start: startTime, end: startTime + 40, label: 'Bloodlust', group: 6, src: id, multiplier: 1.3 } as any);
      setNextBuffId(nextBuffId - 1);
    } else if (key === 'SEF') {
      extraBuffs.push({ id: nextBuffId, key: 'SEF', start: startTime, end: startTime + 15, label: 'SEF', group: 4, src: id } as any);
      setNextBuffId(nextBuffId - 1);
    } else if (key === 'RSK' || key === 'RSK_HL') {
      extraBuffs.push({ id: nextBuffId, key: 'Acclamation', start: startTime, end: startTime + 12, label: 'Acclamation', group: 5, src: id } as any);
      setNextBuffId(nextBuffId - 1);
    } else if (key === 'Xuen') {
      extraBuffs.push({ id: nextBuffId, key: 'Xuen', start: startTime, end: startTime + 20, label: 'Xuen', group: 3, src: id, multiplier: 1.15 } as any);
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
    if (key === 'BOK_HL') {
      dispatch(gainChi(1));
    } else if (chiGain > 0) {
      dispatch(gainChi(chiGain));
    }
    if (sefActiveBuff && originalCost > 0) {
      extension = 0.25 * originalCost;
      setBuffs(bs =>
        bs.map(b =>
          b.key === 'SEF' && b.end > startTime ? { ...b, end: b.end + extension } : b
        )
      );
    }

    console.log(
      `[${startTime.toFixed(3)}s] Cast ${key} → spent ${actualCost} Chi (original ${originalCost})` +
      (chiGain > 0 ? `, gained ${chiGain} Chi` : '') +
      (key === 'RSK' || key === 'RSK_HL' ? ', Acclamation triggered' : '') +
      (extension > 0 ? `, SEF extended by ${extension.toFixed(1)}s` : '') +
      `, Chi now: ${Math.max(0, Math.min(6, chi - actualCost + chiGain))}`
    );


    const baseCd = ability.cooldown ?? 0;
    const hasteMult = (ability as any).affectedByHaste
      ? hasteAt(startTime, [...buffs, ...blessingBuffs], stats.haste)
      : 1;
    const cdDur = baseCd / hasteMult;
    setCasts(cdObj => {
      const out = { ...cdObj } as Record<string, SkillCast[]>;
      if (key === 'SEF') {
        out['RSK'] = (out['RSK'] || []).filter(cd => getEndAt(cd, buffs) <= startTime);
        out['RSK_HL'] = (out['RSK_HL'] || []).filter(cd => getEndAt(cd, buffs) <= startTime);
        console.log('SEF triggered cooldown reset on RSK and RSK_HL');
        if (!out['RSK_HL']) {
          console.warn('RSK_HL not found for cooldown reset triggered by SEF');
        }
      }
      if (key === 'BOK' || key === 'BOK_HL') {
        const reduction = cdSpeedAt(startTime, buffs);
        let fofReduced = 0;
        let rskReduced = 0;
        const applyReduce = (
          list: SkillCast[] = [],
          track: (diff: number) => void,
        ) =>
          list
            .map(cd => {
              const end = getEndAt(cd, buffs);
              if (end <= startTime) return cd;
              const newEnd = Math.max(startTime, end - reduction);
              track(end - newEnd);
              if (newEnd <= cd.start) return null;
              const newBase = cdProgress(cd.start, newEnd, buffs, cdSpeedAt);
              return { ...cd, base: newBase };
            })
            .filter(Boolean) as SkillCast[];
        out['FoF'] = applyReduce(out['FoF'], d => (fofReduced += d));
        const rsk = applyReduce(out['RSK'], d => (rskReduced += d));
        out['RSK'] = rsk;
        out['RSK_HL'] = rsk;
        setItems(items =>
          items.map(it =>
            it.id === id
              ? {
                  ...it,
                  title: `FoF -${fofReduced.toFixed(1)}s, RSK -${rskReduced.toFixed(
                    1,
                  )}s`,
                }
              : it,
          ),
        );
      }
      const rec = { id: String(id), start: startTime, base: cdDur, haste: hasteMult };
      out[key] = [ ...(cdObj[key] || []), rec ];
      if (key === 'RSK_HL') {
        out['RSK'] = [ ...(out['RSK'] || []), rec ];
      } else if (key === 'RSK') {
        out['RSK_HL'] = [ ...(out['RSK_HL'] || []), rec ];
      }
      return out;
    });
    setTime(startTime + (castDur > 0 ? castDur : isGCD ? 1 : 0.001));
  };

  // vertical lines showing when a cooldown finishes
  const cdLines = Object.entries(timeline)
    .flatMap(([k, recs]) =>
      recs
        .map((c, i) => (c.end > time ? { id: `${k}-${i}`, time: c.end } : null))
        .filter(Boolean) as TLItem[]
    );
  const phaseLines = bossData
    ? bossData.phases.slice(1).map((p, i) => ({ id: `phase-${i}`, time: p.start }))
    : [];
  const allLines = [...cdLines, ...phaseLines];

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
  const filteredCdBars = compactViewMode
    ? cdBars.filter(b => b.group === 10 || b.group === 11)
    : cdBars;

  const qlBuffs = buffs.filter(b => b.key.endsWith('_BD'));
  const acclamationBuffs = buffs.filter(b => b.key === 'Acclamation');
  const otherBuffs = buffs.filter(b => !b.key.endsWith('_BD') && b.key !== 'Acclamation');

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
        group: 7,
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
          group: 9,
          start: s,
          end: e,
          label: `+${extra.toFixed(1)}s/s`,
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
      group: 8,
      start: seg.start,
      end: seg.end,
      label: `${seg.stacks}×`,
      className: 'blessing',
      stacks: seg.stacks,
    }));
  })();

  const acclamationItems: TLItem[] = (() => {
    const segs = computeAcclamationSegments(acclamationBuffs);
    return segs.map((seg, i) => ({
      id: 15500 + i,
      group: 5,
      start: seg.start,
      end: seg.end,
      label: `${seg.pct}%`,
      className: 'buff',
    }));
  })();

  const buffItems: TLItem[] = [
    ...qlItems,
    ...blessingItems,
    ...acclamationItems,
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
        group: 2,
        start: s,
        end: e,
        label: lbl,
        className: 'haste',
        title: lbl,
      });
    }
    return res;
  })();

  const bossItems: TLItem[] = React.useMemo(() => {
    if (!bossData) return [];
    const phases = [...bossData.phases].sort((a, b) => a.start - b.start);
    return bossData.timeline.map((ev, i) => {
      const phase = phases.filter(p => ev.start >= p.start).slice(-1)[0];
      const title = phase ? `${ev.label} (${phase.label})` : ev.label;
      return {
        id: 30000 + i,
        group: 7,
        start: ev.start,
        label: `<div class="timeline-event-icon"><img src="${ev.icon}" alt="${ev.label}" /></div>`,
        className: 'boss-event',
        title,
      } as TLItem;
    });
  }, [bossData]);

  const phaseItems: TLItem[] = React.useMemo(() => {
    if (!bossData) return [];
    return bossData.phases.map((p, i) => ({
      id: 31000 + i,
      group: 1,
      start: p.start,
      label: p.label,
      className: 'phase-marker',
    }));
  }, [bossData]);

  const visibleAbilityItems: TLItem[] = React.useMemo(() => {
    const pseudoDur = 1;
    if (!compactViewMode) {
      return items.map(it =>
        it.ability === 'SEF'
          ? { ...it, end: it.start + pseudoDur, type: 'guide' }
          : it,
      );
    }
    const abilityItems = items
      .filter(i => i.group === 10 || i.group === 11)
      .sort((a, b) => a.start - b.start);
    const res: TLItem[] = [];
    for (let i = 0; i < abilityItems.length; i++) {
      const cur = abilityItems[i];
      const next = abilityItems[i + 1];
      if (next && next.start - cur.start <= 5) {
        if (cur.ability === 'Xuen' && next.ability === 'SEF') {
          const icon = ABILITY_ICON_MAP['Xuen_SEF'];
          res.push({
            ...cur,
            label: `<div class="timeline-event-icon"><img src="${icon.src}" alt="Xuen+SEF" /></div>`,
            className: `${cur.className ?? ''} Xuen_SEF`.trim(),
          });
          i++;
          continue;
        }
        if (cur.ability === 'AA' && next.ability === 'SW') {
          const icon = ABILITY_ICON_MAP['AA_SW'];
          res.push({
            ...cur,
            label: `<div class="timeline-event-icon"><img src="${icon.src}" alt="AA+SW" /></div>`,
            className: `${cur.className ?? ''} AA_SW`.trim(),
          });
          i++;
          continue;
        }
        if (cur.ability === 'SW' && next.ability === 'AA') {
          const icon = ABILITY_ICON_MAP['SW_AA'];
          res.push({
            ...cur,
            label: `<div class="timeline-event-icon"><img src="${icon.src}" alt="SW+AA" /></div>`,
            className: `${cur.className ?? ''} SW_AA`.trim(),
          });
          i++;
          continue;
        }
      }
      res.push(cur);
    }
    return res.map(it => ({ ...it, end: it.start + pseudoDur, type: 'guide' }));
  }, [items, compactViewMode]);

  const visibleCdBars = filteredCdBars;

  useEffect(() => {
    const { items: newItems, buffs: newBuffs, casts: newCasts, chi: newChi } =
      recomputeTimeline(items, stats.haste);
    if (JSON.stringify(newItems) !== JSON.stringify(items)) setItems(newItems);
    setBuffs(newBuffs as any);
    setCasts(newCasts);
    dispatch(setChi(newChi));
    const minBuffId = newBuffs.reduce((m, b) => Math.min(m, b.id), 0);
    setNextBuffId(n => Math.min(n, minBuffId - 1));
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
    while (isChanneling(finalStart, id)) {
      const conflicts = items.filter(
        it => it.id !== id && it.end !== undefined && finalStart < it.end && finalStart >= it.start,
      );
      if (!conflicts.length) break;
      finalStart = Math.max(...conflicts.map(it => it.end!));
    }
    if (finalStart !== snapStart) {
      setAutoAdjustMsg(t('释放时间已自动调整至可用时间'));
      setTimeout(() => setAutoAdjustMsg(''), 2000);
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

  const exportAPL = () => {
    const abilityItems = items.filter(i => i.ability) as TLItem[];
    let apl: string;
    try {
      apl = exportSimcApl(
        abilityItems.map(it => ({ ability: it.ability!, start: it.start })),
        abilities,
      );
    } catch (e) {
      alert((e as Error).message);
      return;
    }
    downloadText(apl, 'shellwalker_export.simc');
  };

  return (
    <div className="app-layout">
      <aside className="sidebar p-4 space-y-4">
      <h1 className="text-xl font-bold">{t('踏风排轴器')}</h1>
      <h1 className="text-xl">{t('Boss时间轴选项')}</h1>
      <div className="space-y-1">
        <input
          className="text-black w-full"
          placeholder="/path/to/boss.json"
          value={bossUrl}
          onChange={e => setBossUrl(e.target.value)}
        />
        <button onClick={() => loadBoss(bossUrl)} className="px-2 py-1 border rounded">Load</button>
      </div>
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

      <div className="space-y-2">
        <h2 className="text-lg font-bold">Presets</h2>
        <div className="flex gap-2">
          <input
            className="text-black flex-1"
            placeholder="Name"
            value={presetName}
            onChange={e => setPresetName(e.target.value)}
          />
          <button onClick={savePreset} className="px-2 py-1 border rounded">Save Plan</button>
        </div>
        <div className="flex gap-2">
          <select
            className="text-black flex-1"
            value={selectedPreset}
            onChange={e => setSelectedPreset(e.target.value)}
          >
            <option value="">Select preset</option>
            {presetList.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <button onClick={loadPreset} className="px-2 py-1 border rounded">Load</button>
          <button onClick={deletePreset} className="px-2 py-1 border rounded">Delete</button>
          <button onClick={exportAPL} className="px-2 py-1 border rounded">{t('导出SimC APL')}</button>
        </div>
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
      <main className="timeline-container">
        {autoAdjustMsg && (
          <div className="auto-adjust-toast">{autoAdjustMsg}</div>
        )}
        <Timeline
          items={[...phaseItems, ...hasteItems, ...visibleAbilityItems, ...buffItems, ...visibleCdBars, ...bossItems]}
          start={viewStart}
          end={viewStart + duration}
          cursor={time}
          cds={allLines}
          showCD={showCD}
          compact={compactViewMode}
          onCursorChange={setTime}
          onRangeChange={(s, e) => {
            setViewStart(s);
            setDuration(e - s);
            if (e - s > 60 && !compactViewMode) {
              setCompactViewMode(true);
              setAutoAdjustMsg(t('已切换为简化视图模式，仅显示主技能。'));
              setTimeout(() => setAutoAdjustMsg(''), 2000);
            } else if (e - s <= 60 && compactViewMode) {
              setCompactViewMode(false);
            }
          }}
          onItemMove={moveItem}
          onItemContext={contextItem}
          onItemClick={selectItem}
        />
      </main>
    </div>
  );
}