import { describe, it, expect } from 'vitest';
import { BuffManager, hasteMult } from '../src/combat/azureDragonHeart';
import { CC, SW } from '../src/combat/skills';
import { computeBlessingSegments } from '../src/util/blessingSegments';

function use(skill:any, t:number, mgr:BuffManager) {
  skill.use(t, mgr);
}

describe('Blessing stacks', () => {
  it('stack interaction and haste', () => {
    const mgr = new BuffManager();
    // cast CC at 0s (starts at 4s)
    use(CC, 0, mgr);
    mgr.advance(5);
    expect(mgr.activeBlessings(5).length).toBe(1);

    // cast SW while CC active
    use(SW, 5, mgr); // SW buff starts at 5.4s
    mgr.advance(6);
    expect(mgr.activeBlessings(6).length).toBe(2);

    // advance to CC expiration (10s)
    mgr.advance(10);
    const stacksAt10 = mgr.activeBlessings(10);
    expect(stacksAt10.length).toBe(2);
    const sw = stacksAt10.find(b => b.source === 'SW');
    expect(sw && Math.abs(sw.end - 17.4) < 0.001).toBe(true);
    expect(hasteMult(mgr, 10)).toBeCloseTo(Math.pow(1.15, 2), 2);
  });

  it('segments show stack labels', () => {
    const buffs = [
      { start: 0, end: 6 },
      { start: 2, end: 8 },
      { start: 4, end: 10 },
    ];
    const segs = computeBlessingSegments(buffs);
    const labels = segs.map(s => `${s.stacks}×`).join(' ');
    expect(labels.includes('3×')).toBe(true);
  });
});
