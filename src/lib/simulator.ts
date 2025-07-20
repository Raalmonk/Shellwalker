import { Buff, cdEnd } from './cooldown';
import { cdSpeedAt, hasteAt } from '../App';
import { SkillCast } from '../types';

export interface SkillEvent extends SkillCast {}

export function buildTimeline(
  events: SkillEvent[],
  buffs: Buff[]
): Record<string, { start: number; end: number }> {
  const sorted = [...events].sort((a, b) => a.start - b.start);
  const res: Record<string, { start: number; end: number }> = {};
  for (const ev of sorted) {
    const speed = (t: number, bs: Buff[]) => {
      const cdSpd = cdSpeedAt(t, bs);
      const haste = 1 + hasteAt(t, bs);
      return ['RSK', 'FoF', 'WU'].includes(ev.id) ? cdSpd * haste : cdSpd;
    };
    const end = cdEnd(ev.start, ev.base, buffs, speed);
    res[ev.id] = { start: ev.start, end };
  }
  return res;
}

// END_PATCH
