import { describe, it, expect } from 'vitest';
import { computeAcclamationSegments } from '../src/util/acclamationSegments';

describe('Acclamation segments', () => {
  it('merges overlapping debuffs into stack segments', () => {
    const buffs = [
      { start: 0, end: 12 },
      { start: 5, end: 17 },
    ];
    const segs = computeAcclamationSegments(buffs);
    // expect a segment with 2 stacks between 5 and 12
    const hasTwo = segs.some(s => s.start === 5 && s.end === 12 && s.stacks === 2);
    expect(hasTwo).toBe(true);
  });
});
