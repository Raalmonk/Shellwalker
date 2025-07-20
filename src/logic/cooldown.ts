export interface Skill {
  id: string;
  castTime: number;
  cooldown: number;
}

export type CooldownMap = Record<string, number>;

/** remove entries that are already ready at `now` */
function applyElapsed(cd: CooldownMap, now: number): CooldownMap {
  const out: CooldownMap = {};
  for (const [id, readyAt] of Object.entries(cd)) {
    if (readyAt > now) out[id] = readyAt;
  }
  return out;
}

/** start cooldown for a skill at absolute time `now` */
export function startSkill(cd: CooldownMap, s: Skill, now: number): CooldownMap {
  let after = applyElapsed(cd, now);
  if (s.castTime > 0) {
    const progressed: CooldownMap = {};
    for (const [id, readyAt] of Object.entries(after)) {
      progressed[id] = Math.max(readyAt - s.castTime, now);
    }
    after = progressed;
  }
  const readyAt = now + s.castTime + s.cooldown;
  return { ...after, [s.id]: readyAt };
}

/** remove a skill from cooldown tracking */
export function removeSkill(cd: CooldownMap, id: string): CooldownMap {
  const { [id]: _, ...rest } = cd;
  return { ...rest };
}

/** advance time from `from` to `to`, pruning ready skills */
export function advance(cd: CooldownMap, from: number, to: number): CooldownMap {
  if (to <= from) return { ...cd };
  return applyElapsed(cd, to);
}

export type TimelineAction =
  | { t: number; op: 'start'; skill: Skill }
  | { t: number; op: 'remove'; id: string };

/** debugging helper: produce snapshots every stepMs */
export function timeline(
  init: CooldownMap,
  events: TimelineAction[],
  totalMs: number,
  stepMs = 100,
): Array<{ t: number; cd: CooldownMap }> {
  const shots: Array<{ t: number; cd: CooldownMap }> = [];
  const sorted = [...events].sort((a, b) => a.t - b.t);
  let idx = 0;
  let current = 0;
  let cd: CooldownMap = { ...init };

  // process events at t <= 0
  while (idx < sorted.length && sorted[idx].t <= 0) {
    const ev = sorted[idx++];
    cd = ev.op === 'start' ? startSkill(cd, ev.skill, ev.t) : removeSkill(cd, ev.id);
  }
  shots.push({ t: 0, cd: { ...cd } });

  while (current < totalMs) {
    const next = Math.min(current + stepMs, totalMs);
    let t = current;
    while (idx < sorted.length && sorted[idx].t <= next) {
      const actTime = sorted[idx].t;
      cd = advance(cd, t, actTime);
      t = actTime;
      const ev = sorted[idx++];
      cd = ev.op === 'start' ? startSkill(cd, ev.skill, ev.t) : removeSkill(cd, ev.id);
    }
    cd = advance(cd, t, next);
    current = next;
    shots.push({ t: current, cd: { ...cd } });
  }

  return shots;
}

// END_PATCH
