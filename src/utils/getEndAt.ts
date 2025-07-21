import { cdEnd, Buff } from '../lib/cooldown';
import { cdSpeedAt } from '../lib/speed';
import { autoBless } from '../lib/bless';
import { hasteAt } from '../App';
import { SkillCast } from '../types';

export function getEndAt(cast: SkillCast, buffs: Buff[]): number {
  const all = autoBless(buffs as any);
  const speed = (t: number) => {
    const cdSpd = cdSpeedAt(t, all as any);
    const haste = 1 + hasteAt(t, all);
    return ['RSK', 'FoF', 'WU'].includes(cast.id) ? cdSpd * haste : cdSpd;
  };
  return cdEnd(cast.start, cast.base, all, (t) => speed(t));
}
// END_PATCH
