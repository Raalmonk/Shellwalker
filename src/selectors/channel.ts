import { selectTotalHasteAt } from './haste';
import { buffActive } from './buff';
import { abilityById } from '../constants/abilities';
import type { RootState } from '../logic/dynamicEngine';

export function dragonFactorAt(state: RootState, t: number) {
  const sw = buffActive(state, 'SW', t);
  const aa = buffActive(state, 'AA', t);
  const cc = buffActive(state, 'CC', t);
  return sw && (aa || cc) ? 0.25 : sw || aa || cc ? 0.5 : 1;
}

export function selectRemainingChannel(state: RootState, id: string) {
  const cast = state.channels.active[id];
  if (cast == null) return 0;
  const ability = abilityById(id);
  const base = ability.baseChannelMs ?? 0;
  if (id === 'CC' && ability.channelDynamic) {
    const h = selectTotalHasteAt(state, cast);
    console.log(
      `[DEBUG][CC] at t=${cast}ms, totalHaste=${h.toFixed(2)}, expectedDuration=${(
        base / h
      ).toFixed(2)}ms`,
    );
  }
  const dt = 50;
  let t = cast;
  let done = 0;
  if (!ability.channelDynamic) {
    return Math.max(0, cast + base - state.now);
  }
  while (done < base) {
    const haste = selectTotalHasteAt(state, t);
    const rate =
      id === 'FoF'
        ? haste / dragonFactorAt(state, t)
        : haste;
    done += dt * rate;
    t += dt;
    if (t - cast > 600000) break;
  }
  return Math.max(0, t - state.now);
}

export const makeRemainingChannelSelector = (id: string) =>
  (s: RootState) => selectRemainingChannel(s, id);

export const selectRemFoF = makeRemainingChannelSelector('FoF');
export const selectRemCC = makeRemainingChannelSelector('CC');
export const selectRemSW = makeRemainingChannelSelector('SW');
