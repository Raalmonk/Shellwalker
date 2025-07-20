export interface Buff { start: number; end: number }

export function computeCooldownEnd(
  start: number,
  baseCd: number,
  events: Buff[],
  cdSpeedAt: (t: number) => number,
): number {
  const points = Array.from(
    new Set(
      events
        .flatMap(b => [b.start, b.end])
        .filter(t => t > start)
    ),
  ).sort((a, b) => a - b);

  let remain = baseCd;
  let prev = start;
  for (const p of points) {
    const speed = cdSpeedAt((prev + p) / 2);
    const delta = (p - prev) * speed;
    if (delta >= remain) {
      return prev + remain / speed;
    }
    remain -= delta;
    prev = p;
  }
  return prev + remain;
}

// END_PATCH
