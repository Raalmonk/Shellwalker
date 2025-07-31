import { describe, it, expect } from 'vitest';
import { cdEnd, cdProgress } from '../src/lib/cooldown';
import { cdSpeedAt } from '../src/lib/speed';
import { SkillCast } from '../src/types';
import type { Buff } from '../src/lib/cooldown';

describe('Blackout Kick cooldown reduction', () => {
  it('reduces FoF by 1s without buffs', () => {
    const buffs: Buff[] = [];
    const fof: SkillCast = { id: 'FoF', start: 0, base: 24 };
    const end = cdEnd(fof.start, fof.base, buffs, cdSpeedAt);
    expect(end).toBeCloseTo(24, 3);
    const reduction = cdSpeedAt(1, buffs);
    const newEnd = Math.max(1, end - reduction);
    const newBase = cdProgress(fof.start, newEnd, buffs, cdSpeedAt);
    const updated: SkillCast = { ...fof, base: newBase };
    expect(cdEnd(updated.start, updated.base, buffs, cdSpeedAt)).toBeCloseTo(23, 3);
  });

  it('reduces FoF by 1.75s with SW buff', () => {
    const sw: Buff = { key: 'SW_BD', start: 0, end: 4 } as any;
    const buffs: Buff[] = [sw];
    const fof: SkillCast = { id: 'FoF', start: 0, base: 24 };
    const end = cdEnd(fof.start, fof.base, buffs, cdSpeedAt);
    expect(end).toBeCloseTo(21, 3); // 4s at 1.75 speed then 17s at 1x
    const reduction = cdSpeedAt(1, buffs); // 1.75
    const newEnd = Math.max(1, end - reduction);
    const newBase = cdProgress(fof.start, newEnd, buffs, cdSpeedAt);
    const updated: SkillCast = { ...fof, base: newBase };
    expect(cdEnd(updated.start, updated.base, buffs, cdSpeedAt)).toBeCloseTo(19.25, 3);
  });
});
