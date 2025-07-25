import { buffActive } from '../logic/dynamicEngine';
import type { RootState } from '../logic/dynamicEngine';

export const hasCdSweep = (state: RootState, t: number) =>
  buffActive(state, 'AA', t) && buffActive(state, 'SW', t);

export function sweepRate(state: RootState, t: number): number {
  const sw = buffActive(state, 'SW', t);
  const aa = buffActive(state, 'AA', t);
  const cc = buffActive(state, 'CC', t);

  if (!sw) return 0;
  if (aa && !cc) return 3.0625;
  if (cc && !aa) return 4.375;
  if (aa && cc) return Math.max(3.0625, 4.375);
  return 0;
}
