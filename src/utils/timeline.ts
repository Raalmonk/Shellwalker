import { GRID_STEP_MS } from '../constants/time';
import { getEndAt } from './getEndAt';
import type { SkillCast } from '../types';
import type { Buff } from '../lib/cooldown';

export function roundToGridMs(ms: number): number {
  return Math.round(ms / GRID_STEP_MS) * GRID_STEP_MS;
}

export interface Plan {
  casts: Record<string, SkillCast[]>;
  buffs: Buff[];
}

export function getNextAvailableCastTime(
  abilityId: string,
  proposedStart: number,
  plan: Plan,
  excludeId?: string,
): number {
  let t = proposedStart;
  const recs = plan.casts[abilityId] || [];
  while (true) {
    const conflict = recs
      .filter(c => c.id !== excludeId)
      .find(c => t < getEndAt(c, plan.buffs) && t >= c.start);
    if (!conflict) break;
    const end = getEndAt(conflict, plan.buffs);
    if (end <= t) break;
    t = end;
  }
  return t;
}

export interface SkillEvent {
  id: number;
  ability?: string;
  group: number;
  start: number;
  end?: number;
  label: string;
  className?: string;
  pendingDelete?: boolean;
}
