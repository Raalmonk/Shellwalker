import { abilityById } from '../constants/abilities';
import type { RootState } from '../logic/dynamicEngine';
import { selectTotalHasteAt } from '../selectors';
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
    const rate =
      abilityId === 'FoF'
        ? haste / dragonFactorAt(state, t)
        : haste;
    const delta = dt * rate;
    if (acc + delta > (ability.baseChannelMs ?? 0)) {
      const remain = (ability.baseChannelMs ?? 0) - acc;
      acc = ability.baseChannelMs ?? 0;
      t += remain / rate;
      break;
    }
    acc += delta;
    t += dt;
  }
  return Math.min(acc, ability.baseChannelMs ?? 0);
}

export function channelDurationMs(
  state: RootState,
  abilityId: string,
  cast: number,
): number {
  const ability = abilityById(abilityId);
  const dt = 100;
  let t = cast;
  let acc = 0;
  while (acc < (ability.baseChannelMs ?? 0)) {
    const haste = selectTotalHasteAt(state, t);
    const rate =
      abilityId === 'FoF'
        ? haste / dragonFactorAt(state, t)
        : haste;
    const delta = dt * rate;
    if (acc + delta >= (ability.baseChannelMs ?? 0)) {
      const remain = (ability.baseChannelMs ?? 0) - acc;
      t += remain / rate;
      acc = ability.baseChannelMs ?? 0;
      break;
    }
    acc += delta;
    t += dt;
  }
  return t - cast;
}
