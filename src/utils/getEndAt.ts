import { cdEnd, Buff } from '../lib/cooldown';
import { cdSpeedAt, hasteAt } from '../App';
import { SkillCast } from '../types';

export function getEndAt(cast: SkillCast, buffs: Buff[]): number {
  const speed = (t: number, b: Buff[]) => {
    const cdSpd = cdSpeedAt(t, b);
    const haste = 1 + hasteAt(t, b);
    return ['RSK', 'FoF', 'WU'].includes(cast.id) ? cdSpd * haste : cdSpd;
  };
  return cdEnd(cast.start, cast.base, buffs, speed);
}
