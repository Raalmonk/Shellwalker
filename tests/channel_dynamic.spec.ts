import { describe, it, expect, beforeEach } from 'vitest';
import { createState, cast, advanceTime, setGearRating, getChannel } from '../src/logic/dynamicEngine';

let s: ReturnType<typeof createState>;

beforeEach(() => {
  s = createState();
});

describe('dynamic channel recomputation', () => {
  it('FoF channel updates when haste added mid-cast', () => {
    setGearRating(s, 0);
    cast(s, 'FoF');
    advanceTime(s, 1000);
    const before = getChannel(s, 'FoF');
    cast(s, 'BL');
    expect(getChannel(s, 'FoF')).toBeLessThan(before);
  });

  it('FoF dragonFactor 0.25 live', () => {
    cast(s, 'FoF');
    advanceTime(s, 200);
    cast(s, 'SW');
    cast(s, 'AA');
    expect(getChannel(s, 'FoF')).toBeLessThan(800);
  });
});
