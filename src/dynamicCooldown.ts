import { abilityById } from './constants/abilities';
import { selectTotalHasteAt as calcTotalHasteAt, HasteBuff } from './lib/haste';

export interface Buff extends HasteBuff {
  key: string;
}

export interface Cooldown {
  abilityId: string;
  remainingMs: number;
}

export interface RootState {
  now: number;
  hasteRating: number;
  buffs: Buff[];
  cooldowns: Cooldown[];
}

export function createState(hasteRating = 0): RootState {
  return { now: 0, hasteRating, buffs: [], cooldowns: [] };
}

export function buffActive(state: RootState, key: string, t: number) {
  return state.buffs.some(b => b.key === key && b.start <= t && t < b.end);
}

export const dragonsOverlap = (state: RootState, t: number) =>
  buffActive(state, 'AA', t) && buffActive(state, 'SW', t);

export function selectTotalHasteAt(state: RootState, t: number) {
  return calcTotalHasteAt(state.buffs, state.hasteRating, t);
}

export function getEffectiveTickRate(state: RootState, abilityId: string, now: number) {
  const ability = abilityById(abilityId);
  if (ability.snapshot) return 1;
  const base = selectTotalHasteAt(state, now);
  const sync = dragonsOverlap(state, now) ? 1.8 : 0;
  return Math.max(base, sync);
}

export function advanceTime(state: RootState, dt: number) {
  const now = state.now + dt;
  // dynamic cooldowns accelerate if haste increases mid-way
  for (const cd of state.cooldowns) {
    const rate = getEffectiveTickRate(state, cd.abilityId, now);
    cd.remainingMs = Math.max(0, cd.remainingMs - dt * rate);
  }
  state.now = now;
}

export function cast(state: RootState, abilityId: string) {
  const ability = abilityById(abilityId);
  if (abilityId === 'AA') {
    state.buffs.push({ key: 'AA', start: state.now, end: state.now + 6000 });
  } else if (abilityId === 'SW') {
    state.buffs.push({ key: 'SW', start: state.now, end: state.now + 8000 });
  } else if (abilityId === 'BL') {
    state.buffs.push({ key: 'BL', start: state.now, end: state.now + 40000, multiplier: 1.3 });
  }
  const haste = selectTotalHasteAt(state, state.now);
  const duration = ability.snapshot ? ability.cooldown / haste : ability.cooldown;
  state.cooldowns.push({ abilityId, remainingMs: duration });
}

export function getCooldown(state: RootState, abilityId: string) {
  return state.cooldowns.find(c => c.abilityId === abilityId);
}
