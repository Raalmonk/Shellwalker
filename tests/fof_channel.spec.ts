import { describe, it, expect, beforeEach } from 'vitest';
import { createState, cast, setGearRating } from '../src/logic/dynamicEngine';
import { calcFoFChannel } from '../src/utils/channelTime';

let state: ReturnType<typeof createState>;
const RATING_20 = 13200; // ~20% haste

beforeEach(() => {
  state = createState();
});

describe('FoF channel time', () => {
  it('FoF channel scales with haste and dragon factor', () => {
    setGearRating(state, RATING_20); // 1.2x haste
    cast(state, 'SW'); // dragon factor 0.5
    const haste = 1.2;
    const expected = 4000 / haste * 0.5;
    const duration = calcFoFChannel(state, state.now);
    expect(duration).toBeCloseTo(expected, 0);
  });

  it('FoF channel uses 0.25 when SW+AA', () => {
    cast(state, 'SW');
    cast(state, 'AA');
    const expected = 4000 / 1 * 0.25;
    const duration = calcFoFChannel(state, state.now);
    expect(duration).toBeCloseTo(expected, 0);
  });
});

