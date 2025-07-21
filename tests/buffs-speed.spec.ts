import { describe, it, expect } from 'vitest';
import { cdSpeedAt, blessLayersAt, Buff } from '../src/lib/speed';

function b(kind: Buff['kind'], start = 0, end = 6): Buff {
  return { kind, start, end };
}

describe('buff speed formula', () => {
  it('AA then CC', () => {
    const buffs = [b('AA', 0, 1), b('CC', 1, 7), b('BLESS', 1, 5)];
    expect(cdSpeedAt(2, buffs)).toBeCloseTo(2.5, 4);
  });

  it('CW + CC', () => {
    const buffs = [b('CW'), b('CC')];
    expect(cdSpeedAt(1, buffs)).toBeCloseTo(3.625, 4);
  });

  it('CW + AA', () => {
    const buffs = [b('CW'), b('AA')];
    expect(cdSpeedAt(1, buffs)).toBeCloseTo(2.3125, 4);
  });

  it('layers + formula', () => {
    const buffs = [b('CW'), b('CC'), b('BLESS')];
    expect(blessLayersAt(1, buffs)).toBe(3);
    const expected = (1 + 1.5 * 1.75) * Math.pow(1.15, 3);
    expect(cdSpeedAt(1, buffs)).toBeCloseTo(expected, 4);
  });
});

// END_PATCH
