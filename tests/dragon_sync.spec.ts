import { describe, it, expect } from 'vitest';
import { createState, cast, advanceTime, getCooldown, selectTotalHasteAt } from '../src/dynamicCooldown';

describe('dragon sync dynamic cooldown', () => {
  it('AA+SW overlap sweeps 1.8s per s', () => {
    const st = createState();
    cast(st, 'AA');
    cast(st, 'SW');
    cast(st, 'YH');
    advanceTime(st, 5000);
    expect(getCooldown(st, 'YH')!.remainingMs).toBeCloseTo(30000 - 5000 * 1.8, 0);
  });

  it('haste added mid-cd accelerates', () => {
    const st = createState();
    cast(st, 'YH');
    advanceTime(st, 5000); // 25s left
    cast(st, 'BL');
    advanceTime(st, 5000);
    expect(getCooldown(st, 'YH')!.remainingMs).toBeCloseTo(25000 - 5000 * 1.3, 0);
  });

  it('snapshot skills ignore retro haste', () => {
    const st = createState();
    cast(st, 'FoF');
    advanceTime(st, 2000);
    const initialHaste = selectTotalHasteAt(st, 0);
    cast(st, 'BL');
    advanceTime(st, 2000);
    expect(getCooldown(st, 'FoF')!.remainingMs).toBeCloseTo(24000 / initialHaste - 4000, 0);
  });
});
