import { describe, it, expect } from 'vitest';
import { getEndAt } from '../utils/getEndAt';
import { Buff } from '../lib/cooldown';
import { SkillCast } from '../types';

describe('cooldown lazy compute', () => {
  it('FoF ends at 17.93\u00a0s when AA inserted before it', () => {
    const buffs: Buff[] = [{ start: 0, end: 6, key: 'AA_BD' } as any];
    const fof: SkillCast = { id: 'FoF', start: 0, base: 24 };
    const aa: SkillCast  = { id: 'AA',  start: 0, base: 30 };
    expect(getEndAt(fof, buffs)).toBeCloseTo(17.93, 2);
    expect(getEndAt(aa, buffs)).toBeCloseTo(23.93, 2);
  });
});
