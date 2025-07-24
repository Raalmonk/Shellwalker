import { describe, it, expect, beforeEach } from 'vitest';
import {
  createState,
  cast,
  advanceTime,
  setGearRating,
  selectRemainingChannelMs,
} from '../src/logic/dynamicEngine';

let s: ReturnType<typeof createState>;

beforeEach(() => {
  s = createState();
});

it('FoF channel updates when haste added mid-cast', () => {
  setGearRating(s, 0);
  cast(s, 'FoF');
  advanceTime(s, 1000);
  const before = selectRemainingChannelMs(s, 'FoF');
  cast(s, 'BL');
  expect(selectRemainingChannelMs(s, 'FoF')).toBeLessThan(before);
});

it('FoF dragonFactor 0.25 live', () => {
  cast(s, 'FoF');
  advanceTime(s, 200);
  cast(s, 'SW');
  cast(s, 'AA');
  expect(selectRemainingChannelMs(s, 'FoF')).toBeLessThan(1100);
});
