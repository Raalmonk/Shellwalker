import { describe, it, expect, beforeEach } from 'vitest';
import {
  createState,
  cast,
  advanceTime,
  setGearRating,
  selectRemainingChannel,
} from '../src/logic/dynamicEngine';

const RATING_50 = 35829; // ~= 50% haste

let s: ReturnType<typeof createState>;

beforeEach(() => {
  s = createState();
});

it('FoF channel shrinks after adding haste', () => {
  setGearRating(s, 0);
  cast(s, 'FoF');
  advanceTime(s, 1000);
  const before = selectRemainingChannel(s, 'FoF');
  cast(s, 'BL');
  expect(selectRemainingChannel(s, 'FoF')).toBeLessThan(before);
});

it('FoF reacts to dragonFactor 0.25', () => {
  cast(s, 'FoF');
  advanceTime(s, 200);
  const before = selectRemainingChannel(s, 'FoF');
  cast(s, 'SW');
  cast(s, 'AA');
  expect(selectRemainingChannel(s, 'FoF')).toBeLessThan(before * 0.6);
});

it('CC channel reacts to gear haste change', () => {
  cast(s, 'CC');
  advanceTime(s, 500);
  const before = selectRemainingChannel(s, 'CC');
  setGearRating(s, RATING_50);
  expect(selectRemainingChannel(s, 'CC')).toBeLessThan(before);
});
