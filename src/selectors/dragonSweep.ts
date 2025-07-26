import { buffActive } from '../logic/dynamicEngine';
import type { RootState } from '../logic/dynamicEngine';

export function sweepRate(state: RootState, t: number): number {
  const sw = buffActive(state, 'SW', t);
  const aa = buffActive(state, 'AA', t);
  const cc = buffActive(state, 'CC', t);

  if (!sw) return 0; // no sweep without SW

  if (aa && !cc) return 3.0625; // SW + AA only
  if (cc && !aa) return 4.375; // SW + CC only
  if (aa && cc) return Math.max(3.0625, 4.375); // all three → 4.375
  return 0;
}
