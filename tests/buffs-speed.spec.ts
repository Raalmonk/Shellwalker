import { describe, it, expect } from 'vitest';
import { cdSpeedAt, blessLayersAt, Buff } from '../src/lib/speed';
import { applyMutualExclusion, SkillEvent } from '../src/lib/buffs';

function ev(kind: Buff['kind'], start: number, end: number): SkillEvent {
  return { kind, start, end } as SkillEvent;
}

describe('mutual exclusion + speed', () => {
  it('AA at 0s then CC at 1s', () => {
    const events = [ev('AA', 0, 6), ev('CC', 1, 7)];
    const processed = applyMutualExclusion(events, 1);
    expect(cdSpeedAt(2, processed as Buff[])).toBeCloseTo(3.3063, 3);
  });

  it('CW with CC', () => {
    const events = [ev('CW', 0, 8), ev('CC', 0, 6)];
    expect(cdSpeedAt(2, events as Buff[])).toBeCloseTo(4.7941, 4);
  });

  it('CW with AA', () => {
    const events = [ev('CW', 0, 8), ev('AA', 0, 6)];
    expect(cdSpeedAt(2, events as Buff[])).toBeCloseTo(3.0583, 4);
  });

  it('layers count with blessing', () => {
    const events = [ev('CW', 0, 8), ev('CC', 0, 6), ev('BLESS', 0, 4)];
    expect(blessLayersAt(0, events as Buff[])).toBe(3);
    const spd = cdSpeedAt(1, events as Buff[]);
    const expected = (1 + 1.5 * 1.75) * Math.pow(1.15, 3);
    expect(spd).toBeCloseTo(expected, 4);
  });
});

// END_PATCH
