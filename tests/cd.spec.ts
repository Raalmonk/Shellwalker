import { describe, it, expect } from 'vitest';
import { getEndAt } from '../src/utils/getEndAt';
import { SkillCast } from '../src/types';
import type { Buff } from '../src/lib/cooldown';

function b(key: string, start: number, end: number): Buff {
  return { key, start, end } as any;
}

describe('cooldown integration', () => {
  it('AA cooldown ends at 25.50 s with dragon', () => {
    const buffs: Buff[] = [b('AA_BD', 0, 6)];
    const aa: SkillCast = { id: 'AA', start: 0, base: 30 };
    expect(getEndAt(aa, buffs)).toBeCloseTo(25.50, 2);
  });

  it('FoF ends at 19.50 s after AA', () => {
    const buffs: Buff[] = [b('AA_BD', 0, 6)];
    const fof: SkillCast = { id: 'FoF', start: 0, base: 24 };
    expect(getEndAt(fof, buffs)).toBeCloseTo(19.50, 2);
  });
});
