import { describe, it, expect } from 'vitest';
import { getEndAt } from '../src/utils/getEndAt';
import { SkillCast } from '../src/types';
import type { Buff } from '../src/lib/cooldown';
import { hasteAt } from '../src/lib/haste';

const rating = 13200; // 20% gear haste
const bl: Buff = { key: 'BL', start: 0, end: 40000, multiplier: 1.3 } as any;

describe('snapshot cooldown', () => {
  it('FoF under bloodlust snapshots haste', () => {
    const haste = hasteAt(0, [bl], rating);
    const cast: SkillCast = { id: 'FoF', start: 0, base: 24 / haste };
    const end = getEndAt(cast, [bl]);
    expect(end * 1000).toBeCloseTo(24000 / 1.56, 1);
  });
});
