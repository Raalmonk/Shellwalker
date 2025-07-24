import { describe, it, expect } from 'vitest';
import { createState, cast, advanceTime, getCooldown, selectTotalHasteAt } from '../src/dynamicCooldown';

describe('dragon sync sweep', () => {
  it('AA+SW overlap sweeps 1.8s per s', () => {
    const s = createState();
    cast(s, 'AA');
    cast(s, 'SW');
    cast(s, 'YH');
    advanceTime(s, 5_000);
    expect(getCooldown(s, 'YH')!.remainingMs).toBeCloseTo(30_000 - 5_000 * 1.8, 0);
  });

  it('haste added mid-cd accelerates', () => {
    const s = createState();
    cast(s, 'YH');
    advanceTime(s, 5_000);
    cast(s, 'BL');
    advanceTime(s, 5_000);
    expect(getCooldown(s, 'YH')!.remainingMs).toBeCloseTo(25_000 - 5_000 * 1.3, 0);
  });

  it('snapshot skills ignore retro haste', () => {
    const s = createState();
    const initialHaste = selectTotalHasteAt(s, 0);
    cast(s, 'FoF');
    advanceTime(s, 2_000);
    cast(s, 'BL');
    advanceTime(s, 2_000);
    expect(getCooldown(s, 'FoF')!.remainingMs).toBeCloseTo(24_000 / initialHaste - 4_000, 0);
  });
});
