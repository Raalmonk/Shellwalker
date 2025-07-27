import { describe, it, expect } from 'vitest';
import { computeAcclamationSegments } from '../src/util/acclamationSegments';

describe('Acclamation segments', () => {
  it('merges overlapping buffs', () => {
    const buffs = [
      { start: 0, end: 12 },
      { start: 6, end: 18 },
    ];
    const segs = computeAcclamationSegments(buffs);
    expect(segs).toEqual([
      { start: 0, end: 6, pct: 3 },
      { start: 6, end: 12, pct: 6 },
      { start: 12, end: 18, pct: 3 },
    ]);
  });
});
