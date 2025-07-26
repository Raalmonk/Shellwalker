import { buffActive } from '../selectors/buff';
import type { RootState } from '../logic/dynamicEngine';

export function sweepRate(state: RootState, t: number): number {
  const sw = buffActive(state, 'SW', t);
  if (!sw) return 0;
  const aa = buffActive(state, 'AA', t);
  const cc = buffActive(state, 'CC', t);
  if (cc) return 4.375;
  if (aa) return 3.0625;
  return 0;
}
