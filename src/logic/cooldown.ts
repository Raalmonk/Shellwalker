export interface Skill {
  id: string;
  castTime: number;
  cooldown: number;
}

export type CooldownMap = Record<string, number>;

/**
 * Apply elapsed time to a cooldown map.
 * All values are reduced by `elapsed` and expired entries are removed.
 */
function applyElapsed(cd: CooldownMap, elapsed: number): CooldownMap {
  if (elapsed <= 0) return { ...cd };
  const out: CooldownMap = {};
  for (const [id, left] of Object.entries(cd)) {
    const next = left - elapsed;
    if (next > 0) out[id] = next;
  }
  return out;
}

/** start cooldown for a skill */
export function startSkill(cd: CooldownMap, s: Skill): CooldownMap {
  const after = applyElapsed(cd, s.castTime);
  return { ...after, [s.id]: s.cooldown + s.castTime };
}

/** advance cooldowns by dt milliseconds */
export function tick(cd: CooldownMap, dt: number): CooldownMap {
  return applyElapsed(cd, dt);
}

/** remove a skill from cooldown tracking */
export function removeSkill(cd: CooldownMap, id: string): CooldownMap {
  const { [id]: _, ...rest } = cd;
  return { ...rest };
}

export type SimulationAction =
  | { t: number; op: 'start'; skill: Skill }
  | { t: number; op: 'remove'; id: string };

export function simulate(
  actions: SimulationAction[],
  totalMs: number,
  stepMs = 1000,
): Array<{ t: number; cd: CooldownMap }> {
  const timeline: Array<{ t: number; cd: CooldownMap }> = [];
  const sorted = [...actions].sort((a, b) => a.t - b.t);
  let idx = 0;
  let current = 0;
  let cd: CooldownMap = {};

  // process actions at t=0
  while (idx < sorted.length && sorted[idx].t <= 0) {
    const act = sorted[idx++];
    cd = act.op === 'start' ? startSkill(cd, act.skill) : removeSkill(cd, act.id);
  }
  timeline.push({ t: 0, cd: { ...cd } });

  while (current < totalMs) {
    const next = Math.min(current + stepMs, totalMs);
    let t = current;
    while (idx < sorted.length && sorted[idx].t <= next) {
      const actTime = sorted[idx].t;
      cd = tick(cd, actTime - t);
      t = actTime;
      const act = sorted[idx++];
      cd = act.op === 'start' ? startSkill(cd, act.skill) : removeSkill(cd, act.id);
    }
    cd = tick(cd, next - t);
    current = next;
    timeline.push({ t: current, cd: { ...cd } });
  }

  return timeline;
}

// END_PATCH
