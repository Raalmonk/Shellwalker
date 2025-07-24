import { abilityById } from '../constants/abilities';
import type { RootState } from '../logic/dynamicEngine';
import { remainingChannelMs } from '../utils/channelIntegrate';

export const selectRemainingChannelMs = (
  state: RootState,
  id: string,
): number => {
  const cast = state.channels[id as keyof typeof state.channels]?.castTime;
  if (cast == null) return 0;
  return remainingChannelMs(state, id, cast, state.now);
};
