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

/**
 * Compute the effective cooldown "base" consumed between `start` and `end`.
 * This mirrors the integration logic of {@link cdEnd} so that
 * `cdEnd(start, baseBetween(start,end))` would yield `end`.
 */
export function cdBaseBetween(
  start: number,
  end: number,
  buffs: Buff[],
  speedAt: SpeedFn,
): number {
  if (end <= start) return 0;
  let t = start;
  let acc = 0;
  const changes = Array.from(
    new Set(
      buffs
        .flatMap(b => [b.start, b.end])
        .filter(x => x > start && x < end),
    ),
  ).sort((a, b) => a - b);
  changes.push(end);
  for (const edge of changes) {
    const next = Math.min(edge, end);
    const speed = speedAt(t, buffs);
    const span = next - t;
    acc += span * speed;
    t = next;
    if (t >= end) break;
  }
  return acc;
}
