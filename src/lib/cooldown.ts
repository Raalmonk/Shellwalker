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
 * Integrate cooldown progress between two timestamps.
 * Returns the accumulated "base" cooldown consumed from `from` to `to`.
 */
export function cdProgress(
  from: number,
  to: number,
  buffs: Buff[],
  speedAt: SpeedFn
): number {
  if (to <= from) return 0;
  const edges = Array.from(
    new Set(
      buffs
        .flatMap(b => [b.start, b.end])
        .filter(t => t > from && t < to)
    )
  ).sort((a, b) => a - b);
  edges.push(to);
  let t = from;
  let acc = 0;
  for (const edge of edges) {
    const speed = speedAt(t, buffs);
    const span = edge - t;
    acc += span * speed;
    t = edge;
  }
  return acc;
}
