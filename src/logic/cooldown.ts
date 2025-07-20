export interface Skill {
  id: string;
  castTime: number;
  cooldown: number;
}

export type CooldownMap = Record<string, number>;

/** apply elapsed time to cooldown map and remove expired entries */
export function applyElapsed(cd: CooldownMap, elapsed: number): CooldownMap {
  if (elapsed <= 0) return { ...cd };
  const out: CooldownMap = {};
  for (const [k, v] of Object.entries(cd)) {
    const nv = v - elapsed;
    if (nv > 0) out[k] = nv;
  }
  return out;
}

/** start cooldown for a skill */
export function startSkill(
  cd: CooldownMap,
  s: Skill,
  now = Date.now(),
): CooldownMap {
  const after = applyElapsed(cd, s.castTime);
  after[s.id] = s.cooldown + s.castTime;
  return after;
}

/** advance cooldowns by dt milliseconds */
export function tick(cd: CooldownMap, dt: number): CooldownMap {
  return applyElapsed(cd, dt);
}

/** remove a skill from cooldown tracking */
export function removeSkill(cd: CooldownMap, id: string): CooldownMap {
  const { [id]: _, ...rest } = cd;
  return rest;
}

// END_PATCH
