import { hasteAt } from '../lib/haste';

export interface Buff {
  start: number;
  end: number;
  key?: string;
  multiplier?: number;
}

export function calcDynamicEndTime(
  startTime: number,
  baseCast: number,
  buffs: Buff[],
  blessingBuffs: Buff[],
  rating: number,
  fofBuffKeys: string[] = [],
): number {
  if (baseCast <= 0) return startTime;
  const all = [...buffs, ...blessingBuffs];
  const edges = Array.from(
    new Set(all.flatMap(b => [b.start, b.end]).filter(t => t > startTime)),
  ).sort((a, b) => a - b);
  edges.push(Infinity);
  let t = startTime;
  let remain = baseCast;
  for (const edge of edges) {
    const haste = hasteAt(t, all, rating);
    let dragon = 1;
    if (fofBuffKeys.length) {
      const active = buffs
        .filter(b => fofBuffKeys.includes(b.key ?? '') && b.start <= t && t < b.end)
        .map(b => b.key);
      const hasAA = active.includes('AA_BD');
      const hasSW = active.includes('SW_BD');
      const hasCC = active.includes('CC_BD');
      if (hasSW && (hasAA || hasCC)) dragon = 4;
      else if (hasAA || hasSW || hasCC) dragon = 2;
    }
    const rate = haste * dragon;
    const span = edge - t;
    const consumed = span * rate;
    if (consumed >= remain) {
      return t + remain / rate;
    }
    remain -= consumed;
    t = edge;
  }
  return t;
}
