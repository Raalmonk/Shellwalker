import { describe, it, expect } from 'vitest';
import { BuffManager, Blessing } from '../src/combat/azureDragonHeart';
import { CC, SW } from '../src/combat/skills';

function use(skill: any, t: number, mgr: BuffManager) {
  return skill.use(t, mgr);
}

describe('blessing mechanic', () => {
  it('stacks and extension', () => {
    const mgr = new BuffManager();
    use(CC, 0, mgr); // CC starts at 4s
    mgr.advance(4);
    expect(mgr.activeBlessings(4).length).toBe(1);
    expect(mgr.blessingHaste(4)).toBeCloseTo(Math.pow(1.15, 1), 5);

    use(SW, 5, mgr); // SW starts at 5.4s
    mgr.advance(6);
    expect(mgr.activeBlessings(6).length).toBe(2);
    expect(mgr.blessingHaste(6)).toBeCloseTo(Math.pow(1.15, 2), 5);

    mgr.advance(10); // CC ends at 10
    const stacks = mgr.activeBlessings(10);
    expect(stacks.length).toBe(2);
    const sw = stacks.find(b => (b as Blessing).source === 'SW') as Blessing;
    expect(sw.end).toBeCloseTo(5 + 0.4 + 8 + 4, 3);
  });
});
