import { describe, it, expect, beforeEach } from 'vitest';
import {
  createState,
  cast,
  advanceTime,
  setGearHastePercent,
  selectRemainingChannel,
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

it('CC channel = 1.5s/total haste', () => {
  setGearHastePercent(s, 0.20); // gear 1.2×
  cast(s, 'BL'); // +30%
  cast(s, 'CC');
  const rem = selectRemCC(s);
  expect(rem).toBeCloseTo(1500 / (1.2 * 1.3), 0);
});

it('SCK channel = 1.5s/haste', () => {
  setGearHastePercent(s, 0.20); // 1.2×
  cast(s, 'SCK');
  const rem = selectRemainingChannel(s, 'SCK');
  expect(rem).toBeCloseTo(1500 / 1.2, 0);
});

it('SCK_HL channel live updates', () => {
  setGearHastePercent(s, 0);
  cast(s, 'SCK_HL');
  advanceTime(s, 500);
  const before = selectRemainingChannel(s, 'SCK_HL');
  setGearHastePercent(s, 0.50); // 1.5×
  expect(selectRemainingChannel(s, 'SCK_HL')).toBeLessThan(before);
});

it('SW channel unaffected by haste', () => {
  setGearHastePercent(s, 0);
  cast(s, 'SW');
  advanceTime(s, 200);
  const before = selectRemainingChannel(s, 'SW');
  setGearHastePercent(s, 0.50);
  expect(selectRemainingChannel(s, 'SW')).toBeCloseTo(before, 0);
});
