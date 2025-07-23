import { describe, it, expect } from 'vitest';
import { totalHasteAt, BuffEvent } from '../src/lib/haste';

describe('totalHasteAt', () => {
  const rating = 13200; // 20% gear haste

  it('gear only', () => {
    const h = totalHasteAt(rating, [], 0);
    expect(h).toBeCloseTo(1.2, 2);
  });

  it('with Bloodlust', () => {
    const buffs: BuffEvent[] = [{
      id: 'BL',
      name: 'Bloodlust',
      startMs: 0,
      endMs: 40000,
      multiplier: 1.3,
      type: 'buff',
    }];
    const h = totalHasteAt(rating, buffs, 1000);
    expect(h).toBeCloseTo(1.2 * 1.3, 2);
  });
});
