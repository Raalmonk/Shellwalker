export interface AcclamationBuff {
  start: number;
  end: number;
}

export interface AcclamationSegment {
  start: number;
  end: number;
  pct: number;
}

export function computeAcclamationSegments(buffs: AcclamationBuff[]): AcclamationSegment[] {
  const times = Array.from(new Set(buffs.flatMap(b => [b.start, b.end]))).sort((a, b) => a - b);
  const segs: AcclamationSegment[] = [];
  for (let i = 0; i < times.length - 1; i++) {
    const s = times[i];
    const e = times[i + 1];
    const mid = (s + e) / 2;
    const count = buffs.filter(b => b.start <= mid && mid < b.end).length;
    if (count > 0) segs.push({ start: s, end: e, pct: count * 3 });
  }
  return segs;
}
