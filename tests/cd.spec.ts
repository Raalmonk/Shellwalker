import { describe, it, expect } from 'vitest';
import { getEndAt } from '../src/utils/getEndAt';
import { SkillCast } from '../src/types';
import type { Buff } from '../src/lib/cooldown';

function b(key: string, start: number, end: number): Buff {
  return { key, start, end } as any;
}

describe('cooldown integration', () => {
  it('AA cooldown ends at 23.93 s with dragon', () => {
    const buffs: Buff[] = [b('AA_BD', 0, 6)];
    const aa: SkillCast = { id: 'AA', start: 0, base: 30 };
    expect(getEndAt(aa, buffs)).toBeCloseTo(23.93, 2);
  });

  it('FoF ends at 17.93 s after AA', () => {
    const buffs: Buff[] = [b('AA_BD', 0, 6)];
    const fof: SkillCast = { id: 'FoF', start: 0, base: 24 };
    expect(getEndAt(fof, buffs)).toBeCloseTo(17.93, 2);
  });

  it('RSK shortens after Blessing extended', () => {
    const rsk: SkillCast = { id: 'RSK', start: 0, base: 10 };
    const buffs1: Buff[] = [b('Blessing', 0, 4)];
    const end1 = getEndAt(rsk, buffs1);
    const buffs2: Buff[] = [b('Blessing', 0, 8)];
    const end2 = getEndAt(rsk, buffs2);
    expect(end2).toBeLessThan(end1);
  });
});
// END_PATCH
