import type { RootState } from '../logic/dynamicEngine';
import { abilityById } from '../constants/abilities';
import { selectTotalHasteAt } from '../selectors/haste';
import { dragonFactorAt } from '../selectors/dragons';

export function elapsedChannelMs(
  state: RootState,
  abilityId: string,
  cast: number,
  now: number,
): number {
  const ability = abilityById(abilityId);
  const dt = 100;
  let t = cast;
  let acc = 0;
  while (t < now && acc < ability.baseChannelMs) {
    const haste = selectTotalHasteAt(state, t);
    const rate =
      ability.id === 'FoF' ? haste / dragonFactorAt(state, t) : haste;
    acc += dt * rate;
    t += dt;
  }
  return Math.min(acc, ability.baseChannelMs);
}

export function remainingChannelMs(
  state: RootState,
  abilityId: string,
  cast: number,
  now: number,
): number {
  const ability = abilityById(abilityId);
  const dt = 100;
  let t = cast;
  let acc = 0;
  while (acc < ability.baseChannelMs) {
    const haste = selectTotalHasteAt(state, t);
    const rate =
      ability.id === 'FoF' ? haste / dragonFactorAt(state, t) : haste;
    acc += dt * rate;
    t += dt;
    if (t - cast > 600000) break;
  }
  return Math.max(0, t - now);
}
