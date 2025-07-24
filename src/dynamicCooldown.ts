import { abilityById } from './constants/abilities';
import { ratingToHaste } from './lib/haste';

export interface Buff {
  key: string;
  start: number;
  end: number;
  multiplier?: number;
}

export interface CooldownRec {
  abilityId: string;
  remainingMs: number;
}

export interface RootState {
  now: number;
  rating: number;
  buffs: Buff[];
  cooldowns: CooldownRec[];
}

export function createState(rating = 0): RootState {
  return { now: 0, rating, buffs: [], cooldowns: [] };
}

export function buffActive(state: RootState, key: string, t: number) {
  return state.buffs.some(b => b.key === key && t >= b.start && t < b.end);
}

export function selectTotalHasteAt(state: RootState, t: number) {
  const gear = 1 + ratingToHaste(state.rating);
  const mult = state.buffs
    .filter(b => t >= b.start && t < b.end)
    .reduce((p, b) => p * (b.multiplier ?? 1), 1);
  return gear * mult;
}

export function dragonsOverlap(state: RootState, t: number) {
  return buffActive(state, 'AA', t) && buffActive(state, 'SW', t);
}

export function getEffectiveTickRate(state: RootState, abilityId: string, now: number) {
  const ability = abilityById(abilityId);
  const base = ability.snapshot ? 1 : selectTotalHasteAt(state, now);
  const sync = dragonsOverlap(state, now) ? 1.8 : 0;
  return Math.max(base, sync);
}

export function cast(state: RootState, abilityId: string) {
  const ability = abilityById(abilityId);
  if (!ability) return;
  const cd = ability.snapshot
    ? ability.cooldownMs / selectTotalHasteAt(state, state.now)
    : ability.cooldownMs;
  state.cooldowns.push({ abilityId, remainingMs: cd });
  if (abilityId === 'AA') {
    state.buffs.push({ key: 'AA', start: state.now, end: state.now + 6_000 });
  } else if (abilityId === 'SW') {
    state.buffs.push({ key: 'SW', start: state.now, end: state.now + 8_000 });
  } else if (abilityId === 'BL') {
    state.buffs.push({ key: 'BL', start: state.now, end: state.now + 40_000, multiplier: 1.3 });
  }
}

export function advanceTime(state: RootState, dt: number) {
  const now = state.now + dt;
  for (const cd of state.cooldowns) {
    const rate = getEffectiveTickRate(state, cd.abilityId, now);
    cd.remainingMs = Math.max(0, cd.remainingMs - dt * rate);
  }
  state.buffs = state.buffs.filter(b => now < b.end);
  state.now = now;
}
export function getCooldown(state: RootState, abilityId: string) {
  return state.cooldowns.find(c => c.abilityId === abilityId);
}
