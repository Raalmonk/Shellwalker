import { cdEnd, Buff } from '../lib/cooldown';
import { cdSpeedAt } from '../lib/speed';
import { hasteAt } from '../App';
import { SkillCast } from '../types';

export function getEndAt(cast: SkillCast, buffs: Buff[], hasteRating = 0): number {
  if (['RSK', 'FoF', 'WU'].includes(cast.id)) {
    const base = cast.base / hasteAt(cast.start, buffs, hasteRating);
    return cdEnd(cast.start, base, buffs, (t, b) => cdSpeedAt(t, b as any));
  }
  return cdEnd(cast.start, cast.base, buffs, (t, b) => cdSpeedAt(t, b as any));
}
