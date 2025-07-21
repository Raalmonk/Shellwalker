import { expect, test } from 'vitest';
import { cdSpeedAt } from '../src/lib/speed';

const mk = (s: number, d: number, k: string) => ({ start: s, end: s + d, kind: k } as any);

test('AA only', () => {
  const buffs = [mk(0, 6, 'AA')];
  expect(cdSpeedAt(3, buffs)).toBeCloseTo(1.75 * 1.15, 4);
});

test('AA + CW', () => {
  const buffs = [mk(0, 6, 'AA'), mk(0, 8, 'CW')];
  expect(cdSpeedAt(2, buffs)).toBeCloseTo(2.3125 * (1.15 ** 2), 4);
});

test('CC + CW', () => {
  const buffs = [mk(0, 6, 'CC'), mk(0, 8, 'CW')];
  expect(cdSpeedAt(2, buffs)).toBeCloseTo(3.625 * (1.15 ** 2), 4);
});

test('CC dominates AA', () => {
  const buffs = [mk(0, 6, 'CC'), mk(0, 6, 'AA')];
  expect(cdSpeedAt(1, buffs)).toBeCloseTo(2.5 * (1.15 ** 2), 4);
});

// END_PATCH
