import { describe, it, expect, beforeEach } from 'vitest';
import {
  createState,
  cast,
  advanceTime,
  setGearRating,
  selectRemFoF,
  selectRemCC,
} from '../src/logic/dynamicEngine';

let s: ReturnType<typeof createState>;

beforeEach(() => {
  s = createState();
});

it('FoF channel updates when haste added mid-cast', () => {
  setGearRating(s, 0);
  cast(s, 'FoF');
  advanceTime(s, 1000);
  const before = selectRemFoF(s);
  cast(s, 'BL');
  expect(selectRemFoF(s)).toBeLessThan(before);
});

it('FoF dragonFactor 0.25 live', () => {
  cast(s, 'FoF');
  advanceTime(s, 200);
  cast(s, 'SW');
  cast(s, 'AA');
  expect(selectRemFoF(s)).toBeLessThan(1100);
});

it('FoF channel updates when buffs dragged in', () => {
  setGearRating(s, 0);
  cast(s, 'FoF');
  advanceTime(s, 500);
  const before = selectRemFoF(s);
  cast(s, 'SW');
  cast(s, 'AA');
  expect(selectRemFoF(s)).toBeLessThan(before * 0.7);
});

it('CC channel reacts to Bloodlust added after cast', () => {
  cast(s, 'CC');
  advanceTime(s, 700);
  const before = selectRemCC(s);
  cast(s, 'BL');
  expect(selectRemCC(s)).toBeLessThan(before);
});
