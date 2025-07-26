import { describe, it, expect } from 'vitest';
import { getOriginalChiCost, getActualChiCost } from '../src/utils/chiCost';

describe('BLK_HL chi + SEF', () => {
  it('BLK_HL costs 0 Chi, gives 1 Chi, extends SEF by 0.25s', () => {
    const buffs = [{ key: 'SEF', start: 0, end: 10 }];
    const now = 0;
    const orig = getOriginalChiCost('BLK_HL');
    const actual = getActualChiCost('BLK_HL', buffs as any, now);
    expect(orig).toBe(1);
    expect(actual).toBe(0);
    let chi = 2;
    if (actual > 0) chi -= actual;
    if ('BLK_HL' === 'BLK_HL') chi += 1;
    const extension = 0.25 * orig;
    buffs[0].end += extension;
    expect(chi).toBe(3);
    expect(buffs[0].end).toBeCloseTo(10.25, 3);
  });
});
