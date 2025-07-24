import type { RootState } from '../logic/dynamicEngine';
import { buffActive } from '../logic/dynamicEngine';

export function dragonFactorAt(state: RootState, t: number): number {
  const sw = buffActive(state, 'SW', t);
  const aa = buffActive(state, 'AA', t);
  const cc = buffActive(state, 'CC', t);
  if (sw && (aa || cc)) return 0.25;
  if (sw || aa || cc) return 0.5;
  return 1;
}
