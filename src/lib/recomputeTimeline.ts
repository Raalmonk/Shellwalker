import { TLItem } from '../components/Timeline';
import { BuffRec } from '../App';
import { SkillCast } from '../types';
import { wwData, WWKey } from '../jobs/windwalker';
import { calcDynamicEndTime } from '../utils/calcDynamicEndTime';
import { getEndAt } from '../utils/getEndAt';
import { hasteAt } from '../lib/haste';

export interface RecomputeResult {
  items: TLItem[];
  buffs: BuffRec[];
  casts: Record<string, SkillCast[]>;
}

const SEF_EXTENSION_COST_MAP: Record<WWKey, number> = {
  BLK_HL: 1,
  SCK_HL: 2,
  RSK: 2,
  FoF: 3,
  AA: 2,
  SCK: 2,
  BOK: 1,
};

const getOriginalChiCost = (key: WWKey): number => {
  switch (key) {
    case 'TP':
      return 0;
    case 'BOK':
      return 1;
    case 'RSK':
      return 2;
    case 'FoF':
      return 3;
    case 'SCK':
      return 2;
    case 'AA':
      return 2;
    case 'BLK_HL':
      return 1;
    case 'SCK_HL':
      return 2;
    default:
      return 0;
  }
};

const getActualChiCost = (
  key: WWKey,
  _buffs: { key: string; end: number }[],
  _now: number,
): number => {
  if (key === 'SCK_HL') return 0;
  return getOriginalChiCost(key);
};

function blessingBuffsFromDragons(dragons: BuffRec[]): BuffRec[] {
  const sorted = [...dragons].sort((a, b) => a.start - b.start);
  let nid = -1000;
  const res: BuffRec[] = [];
  const add = (start: number, end: number, source: string) => {
    res.push({
      id: nid--,
      key: 'BLG',
      start,
      end,
      label: 'Blessing',
      group: 4,
      multiplier: 1.15,
      source,
    } as any);
  };
  for (const d of sorted) {
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
}

export function recomputeTimeline(
  items: TLItem[],
  haste: number,
): RecomputeResult {
  const abilities = wwData(haste);
  let chi = 2;
  let nextBuffId = -1;
  let buffs: BuffRec[] = [];
  const casts: Record<string, SkillCast[]> = {};
  const ql: BuffRec[] = [];
  const outItems: TLItem[] = items.map(it => ({ ...it, className: (it.className || '').replace('warning', '').trim() }));
  const sorted = [...outItems].sort((a, b) => a.start - b.start);

  const isOnCD = (key: WWKey, start: number, exclude?: string) => {
    const ability = abilities[key];
    const recs = (casts[key] || []).filter(c => c.id !== exclude);
    const maxCharges = key === 'SEF' ? ability.charges ?? 2 : 1;
    const overlaps = recs.filter(c => {
      const end = getEndAt(c, buffs);
      return start < end && end > c.start;
    });
    return overlaps.length >= maxCharges;
  };

  for (const it of sorted) {
    const key = it.ability as WWKey | undefined;
    if (!key) continue;
    const ability = abilities[key];
    const blessing = blessingBuffsFromDragons(ql);
    const baseCast = ability.cast ?? 0;
    const endTime = calcDynamicEndTime(
      it.start,
      baseCast,
      buffs,
      blessing,
      haste,
      key === 'FoF' ? ['AA_BD', 'SW_BD', 'CC_BD'] : [],
    );
    const castDur = endTime - it.start;
    it.end = castDur > 0 ? it.start + castDur : undefined;

    const origCost = getOriginalChiCost(key);
    const cost = getActualChiCost(key, buffs, it.start);
    const gain = key === 'TP' ? 2 : key === 'SEF' ? 2 : key === 'BLK_HL' ? 1 : 0;
    const sefChi = SEF_EXTENSION_COST_MAP[key] || 0;

    let cls = it.className || '';
    if (cost > 0 && chi < cost) cls = (cls + ' warning').trim();
    if (isOnCD(key, it.start, String(it.id))) cls = (cls + ' warning').trim();
    it.className = cls.trim();

    if (cost > 0) chi = Math.max(0, chi - cost);
    if (gain > 0) chi = Math.min(6, chi + gain);

    const sefActive = buffs.find(b => b.key === 'SEF' && b.start <= it.start && b.end > it.start);
    if (sefActive && sefChi > 0) {
      sefActive.end += 0.25 * sefChi;
    }

    if (key === 'AA') {
      const buff = { id: nextBuffId--, key: 'AA_BD', start: it.start, end: it.start + 6, label: 'AA', group: 5, src: it.id } as BuffRec;
      buffs.push(buff);
      ql.push(buff);
    } else if (key === 'SW') {
      const buff = { id: nextBuffId--, key: 'SW_BD', start: it.start + castDur, end: it.start + castDur + 8, label: 'SW', group: 5, src: it.id } as BuffRec;
      buffs.push(buff);
      ql.push(buff);
    } else if (key === 'CC') {
      const start = it.start + castDur;
      buffs = buffs.map(b => (b.key === 'AA_BD' && b.start <= start && start < b.end ? { ...b, end: start } : b));
      const buff = { id: nextBuffId--, key: 'CC_BD', start, end: start + 6, label: 'CC', group: 5, src: it.id } as BuffRec;
      buffs.push(buff);
      ql.push(buff);
    } else if (key === 'BL') {
      buffs.push({ id: nextBuffId--, key: 'BL', start: it.start, end: it.start + 40, label: 'Bloodlust', group: 2, src: it.id, multiplier: 1.3 } as BuffRec);
    } else if (key === 'SEF') {
      buffs.push({ id: nextBuffId--, key: 'SEF', start: it.start, end: it.start + 15, label: 'SEF', group: 3, src: it.id } as BuffRec);
      casts['RSK'] = (casts['RSK'] || []).filter(cd => getEndAt(cd, buffs) <= it.start);
    }

    const baseCd = ability.cooldown ?? 0;
    const hasteMult = (ability as any).affectedByHaste ? hasteAt(it.start, [...buffs, ...blessing], haste) : 1;
    const cdDur = baseCd / hasteMult;
    casts[key] = [
      ...(casts[key] || []),
      { id: String(it.id), start: it.start, base: cdDur, haste: hasteMult },
    ];
  }

  const blessingFinal = blessingBuffsFromDragons(ql);
  return { items: sorted, buffs: [...buffs, ...blessingFinal], casts };
}
