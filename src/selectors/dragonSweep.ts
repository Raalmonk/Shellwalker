import { buffActive } from '../logic/dynamicEngine';
import type { RootState } from '../logic/dynamicEngine';

export const hasCdSweep = (state: RootState, t: number) =>
  buffActive(state, 'AA', t) && buffActive(state, 'SW', t);
