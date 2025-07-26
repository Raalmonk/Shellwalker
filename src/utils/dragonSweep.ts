import { RootState, buffActive } from '../logic/dynamicEngine';

export function sweepRate(state: RootState, t: number): number {
  if (!buffActive(state, 'SW', t)) return 0;
  const cc = buffActive(state, 'CC', t);
  if (cc) return 4.375;
  const aa = buffActive(state, 'AA', t);
  if (aa) return 3.0625;
  return 0;
}
