import { describe, it, expect, beforeEach } from 'vitest';
import {
  createState,
  cast,
  advanceTime,
  setGearRating,
  selectRemFoF,
  selectRemCC,
} from '../src/logic/dynamicEngine';

const RATING_50 = 35829; // ~= 50% haste

let s: ReturnType<typeof createState>;

beforeEach(() => {
  s = createState();
});

it('FoF channel shrinks when haste buff added AFTER cast', () => {
  setGearRating(s, 0);
  cast(s, 'FoF');
  advanceTime(s, 800);
  const before = selectRemFoF(s);
  cast(s, 'BL');
  expect(selectRemFoF(s)).toBeLessThan(before);
});

it('FoF reacts to dragonFactor 0.25 introduced mid-cast', () => {
  cast(s, 'FoF');
  advanceTime(s, 300);
  const before = selectRemFoF(s);
  cast(s, 'SW');
  cast(s, 'AA');
  expect(selectRemFoF(s)).toBeLessThan(before * 0.6);
});

it('CC channel responds to gear haste slider change', () => {
  cast(s, 'CC');
  advanceTime(s, 400);
  const before = selectRemCC(s);
  setGearRating(s, RATING_50);
  expect(selectRemCC(s)).toBeLessThan(before);
});
