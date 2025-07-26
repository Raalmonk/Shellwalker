import { describe, it, expect, beforeEach } from 'vitest';
import {
  createState,
  cast,
  advanceTime,
  setGearHastePercent,
  selectRemFoF,
  selectRemCC,
} from '../src/logic/dynamicEngine';


let s: ReturnType<typeof createState>;

beforeEach(() => {
  s = createState();
});

it('FoF channel shrinks after adding haste', () => {
  setGearHastePercent(s, 0);
  cast(s, 'FoF');
  advanceTime(s, 800);
  const before = selectRemFoF(s);
  cast(s, 'BL');
  expect(selectRemFoF(s)).toBeLessThan(before);
});

it('FoF reacts to dragonFactor 0.25', () => {
  cast(s, 'FoF');
  advanceTime(s, 300);
  const before = selectRemFoF(s);
  cast(s, 'SW');
  cast(s, 'AA');
  expect(selectRemFoF(s)).toBeLessThan(before * 0.6);
});

it('CC channel reacts to gear haste change', () => {
  cast(s, 'CC');
  advanceTime(s, 400);
  const before = selectRemCC(s);
  setGearHastePercent(s, 0.50);
  expect(selectRemCC(s)).toBeLessThan(before);
});
