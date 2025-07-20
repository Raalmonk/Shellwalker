import { describe, it, expect } from 'vitest';
import { computeCooldownEnd, Buff } from '../lib/computeCooldown';

const speedFn = (buffs: Buff[]) => (t: number) => {
  for (const b of buffs) {
    if (t >= b.start && t < b.end) {
      if (b.start === 0 && b.end === 6) return 1.75; // AA dragon
    }
  }
  if (buffs.some(b => b.start === 2 && b.end === 8 && t >= b.start && t < b.end)) {
    return 2.5; // CC dragon
  }
  return 1;
};

describe('computeCooldownEnd', () => {
  it('AA after 0 s, QL 6×0.75 s ⇒ CD ends at 25.5 s', () => {
    const buffs: Buff[] = [{ start: 0, end: 6 }];
    const end = computeCooldownEnd(0, 30, buffs, t => (t < 6 ? 1.75 : 1));
    expect(end).toBeCloseTo(25.5, 2);
  });

  it('AA then CC at 2 s ⇒ CD ends around 19.5 s', () => {
    const buffs: Buff[] = [
      { start: 0, end: 2 },
      { start: 2, end: 8 },
    ];
    const cdSpd = (t: number) => {
      if (t < 2) return 1.75; // AA dragon
      if (t < 8) return 2.5; // CC dragon
      return 1;
    };
    const end = computeCooldownEnd(0, 30, buffs, cdSpd);
    expect(end).toBeCloseTo(19.5, 2);
  });
});

// END_PATCH
