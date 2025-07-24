import { RootState } from '../logic/dynamicEngine';
import { selectTotalHasteAt, dragonsStateAt } from '../selectors';

export function calcFoFChannel(state: RootState, cast: number): number {
  const haste = selectTotalHasteAt(state, cast);
  const { sw, aa, cc } = dragonsStateAt(state, cast);
  const dragonFactor = sw && (aa || cc) ? 0.25 : (sw || aa || cc) ? 0.5 : 1;
  return 4000 / haste * dragonFactor;
}
