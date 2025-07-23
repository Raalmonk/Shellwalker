import { cdEnd, Buff } from '../lib/cooldown';
import { cdSpeedAt } from '../lib/speed';
import { SkillCast } from '../types';

export function getEndAt(cast: SkillCast, buffs: Buff[]): number {
  return cdEnd(cast.start, cast.base, buffs, (t, b) => cdSpeedAt(t, b as any));
}
