import { RootState, buffActive, selectTotalHasteAt } from '../logic/dynamicEngine';

export { selectTotalHasteAt, selectRemainingChannelMs } from '../logic/dynamicEngine';
export { dragonFactorAt } from './dragons';

export function dragonsStateAt(state: RootState, t: number) {
  return {
    sw: buffActive(state, 'SW', t),
    aa: buffActive(state, 'AA', t),
    cc: buffActive(state, 'CC', t),
  };
}
