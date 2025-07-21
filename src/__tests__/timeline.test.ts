import { describe, it, expect } from 'vitest';
import { buildTimeline } from '../lib/simulator';
import { Buff } from '../lib/cooldown';
import { SkillCast } from '../types';

const buffAA: Buff[] = [{ start: 0, end: 6, key: 'AA_BD' } as any];

function ev(id: string, start: number, base: number): SkillCast {
  return { id, start, base };
}

describe('timeline recompute', () => {
  it('scenario A: AA before FoF', () => {
    const casts: Record<string, SkillCast[]> = {
      AA: [ev('AA', 0, 30)],
      FoF: [ev('FoF', 0, 24)],
    };
    const tl = buildTimeline(casts, buffAA);
    expect(tl.FoF[0].end).toBeCloseTo(19.5, 2);
  });

  it('scenario B: insert AA later at earlier time', () => {
    const casts: Record<string, SkillCast[]> = {
      FoF: [ev('FoF', 0, 24)],
      AA: [ev('AA', 0, 30)],
    };
    const tl = buildTimeline(casts, buffAA);
    expect(tl.FoF[0].end).toBeCloseTo(19.5, 2);
  });
});

// END_PATCH
