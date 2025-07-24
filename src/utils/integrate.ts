import type { RootState } from '../logic/dynamicEngine';
import { abilityById } from '../constants/abilities';
import { selectTotalHasteAt } from '../logic/dynamicEngine';
import { dragonFactorAt } from '../selectors/dragons';

export function integrateChannel(
  state: RootState,
  abilityId: 'FoF' | 'CC' | 'SW',
  cast: number,
  now: number,
): number {
  const ability = abilityById(abilityId);
  const dt = 50;
  let t = cast;
  let acc = 0;
  while (t < now && acc < (ability.baseChannelMs ?? 0)) {
    const haste = selectTotalHasteAt(state, t);
    const dragon = abilityId === 'FoF' ? dragonFactorAt(state, t) : 1;
    const rate = haste / dragon;
    acc += dt * rate;
    t += dt;
  }
  return acc;
}

export function remainingChannelTime(
  state: RootState,
  abilityId: 'FoF' | 'CC' | 'SW',
  cast: number,
  now: number,
): number {
  const ability = abilityById(abilityId);
  const dt = 50;
  let t = cast;
  let acc = 0;
  while (acc < (ability.baseChannelMs ?? 0)) {
    const haste = selectTotalHasteAt(state, t);
    const dragon = abilityId === 'FoF' ? dragonFactorAt(state, t) : 1;
    const rate = haste / dragon;
    acc += dt * rate;
    t += dt;
    if (t - cast > 600000) break;
  }
  return Math.max(0, t - now);
}
