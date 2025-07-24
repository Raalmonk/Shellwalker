import { selectTotalHasteAt, buffActive } from '../logic/dynamicEngine';
import { abilityById } from '../constants/abilities';
import type { RootState } from '../logic/dynamicEngine';

const dragonFactorAt = (state: RootState, t: number) => {
  const sw = buffActive(state, 'SW', t);
  const aa = buffActive(state, 'AA', t);
  const cc = buffActive(state, 'CC', t);
  return sw && (aa || cc) ? 0.25 : sw || aa || cc ? 0.5 : 1;
};

export const makeRemainingChannelSelector = (abilityId: string) => {
  return (state: RootState): number => {
    const cast = state.channels[abilityId as keyof typeof state.channels]?.castTime;
    if (cast == null) return 0;
    const base = abilityById(abilityId).baseChannelMs ?? 0;
    const dt = 50;
    let t = cast,
      done = 0;
    while (done < base) {
      const haste = selectTotalHasteAt(state, t);
      const factor = abilityId === 'FoF' ? dragonFactorAt(state, t) : 1;
      const rate = haste / factor;
      done += dt * rate;
      t += dt;
      if (t - cast > 600000) break;
    }
    return Math.max(0, t - state.now);
  };
};

export const selectRemFoF = makeRemainingChannelSelector('FoF');
export const selectRemCC = makeRemainingChannelSelector('CC');
export const selectRemSW = makeRemainingChannelSelector('SW');
