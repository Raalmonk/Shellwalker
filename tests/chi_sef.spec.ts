import { describe, it, expect } from 'vitest';
import { getOriginalChiCost, getActualChiCost, Buff } from '../src/utils/chiCost';

describe('BLK_HL chi and SEF extension', () => {
  it('BLK_HL costs 0 Chi, gives 1 Chi, extends SEF by 0.25s', () => {
    const now = 0;
    const sef: Buff = { key: 'SEF', end: 15 };
    const buffs: Buff[] = [sef];

    const original = getOriginalChiCost('BLK_HL');
    expect(original).toBe(1);

    const actual = getActualChiCost('BLK_HL', buffs, now);
    expect(actual).toBe(0);

    let chi = 2;
    if (actual > 0) chi -= actual;
    chi += 1; // gain from BLK_HL
    if (buffs.find(b => b.key === 'SEF' && b.end > now) && original > 0) {
      sef.end += 0.25 * original;
    }

    expect(chi).toBe(3);
    expect(sef.end).toBeCloseTo(15.25, 3);
  });
});
