import { test, expect } from 'vitest';
import { cdSpeedAt } from '../src/lib/speed';

// mk(start,dur,kind) 快速生成 Buff
const mk = (s: number, d: number, k: string) => ({ start:s, end:s+d, kind:k });

test('单独 AA → 1.75', () => {
  expect(cdSpeedAt(1, [mk(0,6,'AA')])).toBeCloseTo(1.75, 4);
});
test('AA + CW → 3.0625', () => {
  expect(cdSpeedAt(2, [mk(0,6,'AA'), mk(0,8,'CW')])).toBeCloseTo(3.0625, 4);
});
test('CC + CW → 4.375', () => {
  expect(cdSpeedAt(3, [mk(0,6,'CC'), mk(0,8,'CW')])).toBeCloseTo(4.375, 4);
});
test('CC + AA → 2.5', () => {
  expect(cdSpeedAt(4, [mk(0,6,'CC'), mk(0,6,'AA')])).toBeCloseTo(2.5, 4);
});
// END_PATCH
