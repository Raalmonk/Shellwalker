import { describe, it, expect } from 'vitest';
import { selectBlessingHaste, selectTotalHasteAt } from '../src/lib/haste';
import { getEndAt } from '../src/utils/getEndAt';
import type { Buff } from '../src/lib/cooldown';

function b(start: number, end: number): Buff {
  return { start, end, multiplier: 1.15 } as any;
}

describe('blessing haste precision', () => {
  it('calculates correct blessing haste', () => {
    const buffs: Buff[] = [b(0, 5000), b(0, 5000)];
    expect(selectBlessingHaste(buffs as any, 1000)).toBeCloseTo(Math.pow(1.15, 2), 5);
    buffs.push(b(1500, 5500));
    expect(selectBlessingHaste(buffs as any, 2000)).toBeCloseTo(Math.pow(1.15, 3), 5);
  });

  it('FoF cd uses un-rounded total haste', () => {
    const rating = 13200; // +20% gear haste
    const bl: Buff = { start: 0, end: 40000, multiplier: 1.3 } as any;
    const blessings: Buff[] = [b(0, 5000), b(0, 5000)];
    const all = [bl, ...blessings];
    const haste = selectTotalHasteAt(all as any, rating, 1000);
    const cast = { id: 'FoF', start: 0, base: 24 / haste };
    const end = getEndAt(cast, all as any);
    expect(end * 1000).toBeCloseTo(24000 / haste, 0);
  });
});
