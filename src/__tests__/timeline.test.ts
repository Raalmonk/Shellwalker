import { describe, it, expect } from 'vitest';
import { buildTimeline, SkillEvent } from '../lib/simulator';
import { Buff } from '../lib/cooldown';

const buffAA: Buff[] = [{ start: 0, end: 6, key: 'AA_BD' } as any];

function ev(id: string, start: number, base: number): SkillEvent {
  return { id, start, base };
}

describe('timeline recompute', () => {
  it('scenario A: AA before FoF', () => {
    const events = [ev('AA', 0, 30), ev('FoF', 0, 24)];
    const tl = buildTimeline(events, buffAA);
    expect(tl.FoF.end).toBeCloseTo(19.5, 2);
  });

  it('scenario B: insert AA later at earlier time', () => {
    const events = [ev('FoF', 0, 24), ev('AA', 0, 30)];
    const tl = buildTimeline(events, buffAA);
    expect(tl.FoF.end).toBeCloseTo(19.5, 2);
  });
});

// END_PATCH
