import { RootState } from '../logic/dynamicEngine';
import { abilityById } from '../constants/abilities';
import { getEffectiveTickRate } from '../logic/dynamicEngine';

export function elapsedCdMs(
  state: RootState,
  abilityId: string,
  cast: number,
  now: number,
): number {
  let t = cast;
  let soFar = 0;
  const dt = 100; // ms step
  const baseCd = abilityById(abilityId).cooldownMs;
  while (t < now && soFar < baseCd) {
    const rate = getEffectiveTickRate(state, abilityId, t + dt / 2);
    soFar += dt * rate;
    t += dt;
  }
  return Math.min(soFar, baseCd);
}
