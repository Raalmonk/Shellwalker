import { describe, it, expect } from 'vitest';
import { hasteAt, HasteBuff as BuffRec } from '../src/lib/haste';

describe('haste multiplier', () => {
  const rating = 13200; // 20% haste
  it('gear only', () => {
    expect(hasteAt(0, [], rating)).toBeCloseTo(1.2, 2);
  });
  it('gear plus bloodlust', () => {
    const bl: BuffRec = { key: 'BL', start: 0, end: 40000, multiplier: 1.3 };
    expect(hasteAt(1000, [bl], rating)).toBeCloseTo(1.56, 2);
  });
});
