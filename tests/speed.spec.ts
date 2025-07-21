import { expect, test } from 'vitest';
import { cdSpeedAt } from '../src/lib/speed';

const mk = (s: number, d: number, k: string) => ({ start: s, end: s + d, kind: k });

// 单 AA（+1 Blessing）
test('AA only', () => {
  const buffs = [mk(0, 6, 'AA')];
  expect(cdSpeedAt(3, buffs)).toBeCloseTo(1.75 * 1.15, 4);
});

// CW + AA（2 Bless）
test('AA + CW', () => {
  const buffs = [mk(0, 6, 'AA'), mk(0, 8, 'CW')];
  expect(cdSpeedAt(2, buffs)).toBeCloseTo(2.3125 * (1.15 ** 2), 4);
});

// CW + CC（2 Bless）
test('CC + CW', () => {
  const buffs = [mk(0, 6, 'CC'), mk(0, 8, 'CW')];
  expect(cdSpeedAt(2, buffs)).toBeCloseTo(3.625 * (1.15 ** 2), 4);
});

// CC + AA（2 Bless，AA 加速被忽略）
test('CC dominates AA', () => {
  const buffs = [mk(0, 6, 'CC'), mk(0, 6, 'AA')];
  expect(cdSpeedAt(1, buffs)).toBeCloseTo(2.5 * (1.15 ** 2), 4);
});

// END_PATCH
