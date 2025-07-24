import { RootState, buffActive, selectTotalHasteAt } from '../logic/dynamicEngine';

export { selectTotalHasteAt } from '../logic/dynamicEngine';

export function dragonsStateAt(state: RootState, t: number) {
  return {
    sw: buffActive(state, 'SW', t),
    aa: buffActive(state, 'AA', t),
    cc: buffActive(state, 'CC', t),
  };
}
