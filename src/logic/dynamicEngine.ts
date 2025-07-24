import { abilityById } from '../constants/abilities';
import { selectTotalHasteAt as hasteAt, HasteBuff } from '../lib/haste';
import { elapsedCdMs } from '../utils/cooldownIntegrate';
import { hasCdSweep } from '../selectors/dragonSweep';
import { dragonFactorAt } from '../selectors/dragons';

export interface GearChange {
  start: number;
  rating: number;
}

export interface Buff extends HasteBuff { key: string }

export interface SnapshotCd {
  abilityId: string;
  remainingMs: number;
}

export interface DynamicCast {
  abilityId: string;
  castTime: number;
}

export interface RootState {
  now: number;
  gear: GearChange[];
  buffs: Buff[];
  snapshotCds: SnapshotCd[];
  dynamicCasts: DynamicCast[];
  channels: Record<string, { castTime: number }>;
}

export function createState(gearRating = 0): RootState {
  return {
    now: 0,
    gear: [{ start: 0, rating: gearRating }],
    buffs: [],
    snapshotCds: [],
    dynamicCasts: [],
    channels: {},
  };
}

export function setGearRating(state: RootState, rating: number) {
  state.gear.push({ start: state.now, rating });
}

export function buffActive(state: RootState, key: string, t: number) {
  return state.buffs.some(b => b.key === key && b.start <= t && t < b.end);
}

export function gearRatingAt(state: RootState, t: number) {
  let rating = state.gear[0]?.rating ?? 0;
  for (const g of state.gear) {
    if (g.start <= t) rating = g.rating;
    else break;
  }
  return rating;
}

export function dragonsOverlap(state: RootState, t: number) {
  return buffActive(state, 'AA', t) && buffActive(state, 'SW', t);
}

export function selectTotalHasteAt(state: RootState, t: number) {
  const rating = gearRatingAt(state, t);
  return hasteAt(state.buffs, rating, t);
}

export function getEffectiveTickRate(
  state: RootState,
  abilityId: string,
  now: number,
): number {
  const ability = abilityById(abilityId);
  if (ability.snapshot) return 1;
  const baseRate = selectTotalHasteAt(state, now);
  const sweepRate = hasCdSweep(state, now) ? 1.8 : 0;
  return Math.max(baseRate, sweepRate);
}

export function advanceTime(state: RootState, dt: number) {
  state.now += dt;
  for (const cd of state.snapshotCds) {
    cd.remainingMs = Math.max(0, cd.remainingMs - dt);
  }
  // prune finished snapshot cds
  state.snapshotCds = state.snapshotCds.filter(c => c.remainingMs > 0);
  // remove finished channels
  for (const id of Object.keys(state.channels)) {
    if (selectRemainingChannelMs(state, id) <= 0) delete state.channels[id];
  }
}

export function cast(state: RootState, abilityId: string) {
  const ability = abilityById(abilityId);
  if (abilityId === 'AA') {
    state.buffs.push({ key: 'AA', start: state.now, end: state.now + 6000 });
  } else if (abilityId === 'SW') {
    state.buffs.push({ key: 'SW', start: state.now, end: state.now + 8000 });
  } else if (abilityId === 'CC') {
    state.buffs.push({ key: 'CC', start: state.now, end: state.now + 6000 });
  } else if (abilityId === 'BL') {
    state.buffs.push({ key: 'BL', start: state.now, end: state.now + 40000, multiplier: 1.3 });
  }
  if (ability.cooldownMs > 0) {
    if (ability.snapshot) {
      const rem = ability.cooldownMs / selectTotalHasteAt(state, state.now);
      const ex = state.snapshotCds.find(c => c.abilityId === abilityId);
      if (ex) ex.remainingMs = rem;
      else state.snapshotCds.push({ abilityId, remainingMs: rem });
    } else {
      const ex = state.dynamicCasts.find(c => c.abilityId === abilityId);
      if (ex) ex.castTime = state.now;
      else state.dynamicCasts.push({ abilityId, castTime: state.now });
    }
  }
  if (ability.channelDynamic) {
    state.channels[abilityId] = { castTime: state.now };
  }
}

export function selectRemainingCd(state: RootState, abilityId: string): number {
  const ability = abilityById(abilityId);
  if (ability.snapshot) {
    return (
      state.snapshotCds.find(c => c.abilityId === abilityId)?.remainingMs ?? 0
    );
  }
  const cast = state.dynamicCasts.find(c => c.abilityId === abilityId);
  if (!cast) return 0;
  return Math.max(
    0,
    ability.cooldownMs - elapsedCdMs(state, abilityId, cast.castTime, state.now),
  );
}

export const getCooldown = selectRemainingCd;
export const getChannel = selectRemainingChannelMs;

export function selectRemainingChannelMs(state: RootState, id: string): number {
  const cast = state.channels[id]?.castTime;
  if (cast == null) return 0;
  const ability = abilityById(id);
  const haste = selectTotalHasteAt(state, state.now);
  const rate = id === 'FoF' ? haste / dragonFactorAt(state, state.now) : haste;
  const total = (ability.baseChannelMs ?? 0) / rate;
  const elapsed = state.now - cast;
  return Math.max(0, total - elapsed - 1);
}
