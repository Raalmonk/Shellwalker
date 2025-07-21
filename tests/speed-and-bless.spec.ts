import { describe, it, expect } from 'vitest';
import { cdSpeedAt, Buff } from '../src/lib/speed';
import { autoBless } from '../src/lib/bless';

function b(kind: Buff['kind'], start = 0, end = 5): Buff {
  return { kind, start, end };
}

describe('cdSpeedAt with blessings', () => {
  it('scenario A: AA and CC -> count only CC', () => {
    const buffs = [b('AA'), b('CC')];
    const res = cdSpeedAt(1, buffs);
    expect(res).toBeCloseTo(2.875, 4);
  });

  it('scenario B: CW auto bless + manual', () => {
    const base = [b('CW', 0, 8), b('BLESS')];
    const buffs = autoBless(base);
    const res = cdSpeedAt(2, buffs);
    expect(res).toBeCloseTo(1.75 * Math.pow(1.15, 2), 4);
  });

  it('scenario C: SW + AA coexist', () => {
    const buffs = [b('CW'), b('AA')];
    const res = cdSpeedAt(1, buffs);
    expect(res).toBeCloseTo((1 + 0.75 * 1.75) * Math.pow(1.15, 2), 4);
  });

  it('scenario D: SW + CC coexist', () => {
    const buffs = [b('CW'), b('CC')];
    const res = cdSpeedAt(1, buffs);
    expect(res).toBeCloseTo((1 + 1.5 * 1.75) * Math.pow(1.15, 2), 4);
  });

  it('scenario E: Blessing stacking exponent', () => {
    const buffs = [b('BLESS'), b('BLESS'), b('BLESS')];
    const res = cdSpeedAt(1, buffs);
    expect(res).toBeCloseTo(Math.pow(1.15, 3), 4);
  });
});

// END_PATCH
