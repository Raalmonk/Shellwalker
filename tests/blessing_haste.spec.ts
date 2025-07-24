import { describe, it, expect } from 'vitest';
import { BuffManager, hasteMult } from '../src/combat/azureDragonHeart';
import { CC, SW, AA } from '../src/combat/skills';
import { hasteAt } from '../src/lib/haste';
import { getEndAt } from '../src/utils/getEndAt';
import type { Buff } from '../src/lib/cooldown';
import { SkillCast } from '../src/types';

function use(skill: any, t: number, mgr: BuffManager) {
  skill.use(t, mgr);
}

describe('blessing haste precision', () => {
  it('calculates correct blessing haste', () => {
    const mgr = new BuffManager();
    use(CC, 0, mgr);      // CC starts at 4s
    mgr.advance(5);
    use(SW, 5, mgr);      // SW starts at 5.4s
    mgr.advance(6);
    expect(hasteMult(mgr, 6)).toBeCloseTo(Math.pow(1.15, 2), 5);
    use(AA, 6, mgr);      // AA starts at 6s
    mgr.advance(10);
    expect(hasteMult(mgr, 10)).toBeCloseTo(Math.pow(1.15, 3), 5);
  });

  it('FoF cd uses un-rounded total haste', () => {
    const rating = 13200; // 20% gear haste
    const bl: Buff = { key: 'BL', start: 0, end: 40000, multiplier: 1.3 } as any;
    const b1: Buff = { key: 'BLG', start: 0, end: 40000, multiplier: 1.15 } as any;
    const b2: Buff = { key: 'BLG', start: 0, end: 40000, multiplier: 1.15 } as any;
    const total = hasteAt(0, [bl, b1, b2], rating);
    const cast: SkillCast = { id: 'FoF', start: 0, base: 24 / total };
    const end = getEndAt(cast, [bl, b1, b2]);
    expect(end * 1000).toBeCloseTo(24000 / total, 0);
  });
});
