import { describe, it, expect, beforeEach } from 'vitest';
import { createState, cast, advanceTime, getCooldown, selectTotalHasteAt } from '../src/logic/dynamicEngine';

let state: ReturnType<typeof createState>;

beforeEach(() => {
  state = createState();
});

it('AA+SW overlap sweeps 1.8s per s', () => {
  cast(state, 'AA');
  cast(state, 'SW');
  cast(state, 'YH');
  advanceTime(state, 5000);
  expect(getCooldown(state, 'YH')!.remainingMs).toBeCloseTo(30000 - 5000 * 1.8, 0);
});

it('haste added mid-cd accelerates', () => {
  cast(state, 'YH');
  advanceTime(state, 5000);
  cast(state, 'BL');
  advanceTime(state, 5000);
  expect(getCooldown(state, 'YH')!.remainingMs).toBeCloseTo(25000 - 5000 * 1.3, 0);
});

it('snapshot skills ignore retro haste', () => {
  const initialHaste = selectTotalHasteAt(state, state.now);
  cast(state, 'FoF');
  advanceTime(state, 2000);
  cast(state, 'BL');
  advanceTime(state, 2000);
  expect(getCooldown(state, 'FoF')!.remainingMs).toBeCloseTo(24000 / initialHaste - 4000, 0);
});
