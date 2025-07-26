import { buffActive } from '../logic/dynamicEngine';
import type { RootState } from '../logic/dynamicEngine';

export const hasCdSweep = (state: RootState, t: number) => {
  if (!buffActive(state, 'SW', t)) return false;
  return buffActive(state, 'AA', t) || buffActive(state, 'CC', t);
};
