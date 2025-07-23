import type { Buff } from './cooldown';
import { SkillCast } from '../types';
import { getEndAt } from '../utils/getEndAt';

export function buildTimeline(
  casts: Record<string, SkillCast[]>,
  buffs: Buff[],
  hasteRating = 0,
): Record<string, { start: number; end: number }[]> {
  const out: Record<string, { start: number; end: number }[]> = {};
  for (const [key, recs] of Object.entries(casts)) {
    out[key] = recs.map(c => ({ start: c.start, end: getEndAt(c, buffs, hasteRating) }));
  }
  return out;
}

// END_PATCH
