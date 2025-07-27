import { describe, it, expect } from 'vitest';
import { computeAcclamationSegments } from '../src/util/acclamationSegments';

describe('Acclamation segments', () => {
  it('merges overlapping debuffs', () => {
    const buffs = [
      { start: 0, end: 12 },
      { start: 5, end: 17 },
    ];
    const segs = computeAcclamationSegments(buffs);
    expect(segs.length).toBe(3);
    expect(segs[0].stacks).toBe(1);
    expect(segs[1].stacks).toBe(2);
    expect(segs[2].stacks).toBe(1);
  });
});
