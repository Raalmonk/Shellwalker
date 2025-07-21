import { describe, it, expect } from 'vitest';
import { cdSpeedAt, Buff } from '../src/lib/speed';

function b(kind: Buff['kind'], start = 0, end = 5): Buff {
  return { kind, start, end };
}

describe('cdSpeedAt formula', () => {
  it('scenario A: single AA', () => {
    const buffs = [b('AA')];
    expect(cdSpeedAt(1, buffs)).toBeCloseTo(2.0125, 4);
  });

  it('scenario B: AA + CW', () => {
    const buffs = [b('AA'), b('CW')];
    expect(cdSpeedAt(1, buffs)).toBeCloseTo(3.0583, 4);
  });

  it('scenario C: CC + CW', () => {
    const buffs = [b('CC'), b('CW')];
    expect(cdSpeedAt(1, buffs)).toBeCloseTo(4.7941, 4);
  });

  it('scenario D: two Blessings', () => {
    const buffs = [b('BLESS'), b('BLESS')];
    expect(cdSpeedAt(1, buffs)).toBeCloseTo(1.3225, 4);
  });
});

// END_PATCH
