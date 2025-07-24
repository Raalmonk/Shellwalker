import { abilityById } from '../constants/abilities';
import type { RootState } from '../logic/dynamicEngine';
import { selectTotalHasteAt } from '../logic/dynamicEngine';
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
  while (t < now && acc < (ability.baseChannelMs ?? 0)) {
    const haste = selectTotalHasteAt(state, t);
    const rate = abilityId === 'FoF'
      ? haste / dragonFactorAt(state, t)
      : haste;
    acc += dt * rate;
    t += dt;
  }
  return Math.min(acc, ability.baseChannelMs ?? 0);
}
