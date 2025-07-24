import type { RootState } from '../logic/dynamicEngine';
import { remainingChannelTime } from '../utils/integrate';

export const selectRemainingChannelMs = (
  state: RootState,
  id: string,
): number => {
  const cast = state.channels[id as keyof typeof state.channels]?.castTime;
  if (cast == null) return 0;
  return remainingChannelTime(state, id as 'FoF' | 'CC' | 'SW', cast, state.now);
};
