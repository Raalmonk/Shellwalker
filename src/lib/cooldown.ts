export interface Buff { start: number; end: number }
export type SpeedFn = (t: number, buffs: Buff[]) => number;

/**
 * Return the absolute end timestamp for a cooldown that starts at `start` with
 * base duration `baseCd` seconds. `speedAt` should compute the effective
 * cooldown speed multiplier at time `t` given all active `buffs`.
 */
export function cdEnd(
  start: number,
  baseCd: number,
  buffs: Buff[],
  speedAt: SpeedFn
): number {
  let t = start;
  let rem = baseCd;

  const changes = Array.from(
    new Set(buffs.flatMap(b => [b.start, b.end]).filter(x => x > start))
  ).sort((a, b) => a - b);
  changes.push(Infinity);

  for (const edge of changes) {
    const speed = speedAt(t, buffs);
    const span = edge - t;
    const consumed = span * speed;
    if (consumed >= rem) return t + rem / speed;
    rem -= consumed;
    t = edge;
  }
  return t;
}

export function cdUnits(
  start: number,
  end: number,
  buffs: Buff[],
  speedAt: SpeedFn,
) {
  if (end <= start) return 0;
  const points = Array.from(
    new Set(
      buffs
        .flatMap(b => [b.start, b.end])
        .filter(t => t > start && t < end),
    ),
  ).sort((a, b) => a - b);
  points.push(end);
  let t = start;
  let acc = 0;
  for (const p of points) {
    const seg = Math.min(p, end);
    const speed = speedAt(t, buffs);
    acc += (seg - t) * speed;
    t = seg;
    if (t >= end) break;
  }
  return acc;
}

export function reduceCd<T extends { start: number; base: number }>(
  cast: T,
  time: number,
  amount: number,
  buffs: Buff[],
  speedAt: SpeedFn,
): T {
  const end = cdEnd(cast.start, cast.base, buffs, speedAt);
  if (end <= time || amount <= 0) return cast;
  const newEnd = Math.max(time, end - amount);
  const newBase = cdUnits(cast.start, newEnd, buffs, speedAt);
  return { ...cast, base: newBase };
}
