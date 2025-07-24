import { describe, it, expect } from 'vitest';
import { createState, cast, advanceTime, getCooldown } from '../src/logic/dynamicEngine';

it('CD sweep only when AA+SW, not CC+SW', () => {
  let s = createState();
  cast(s, 'AA');
  cast(s, 'SW');
  cast(s, 'YH');
  advanceTime(s, 5000);
  expect(getCooldown(s, 'YH')).toBeLessThan(30000 - 5000 * 1.8 + 1);

  s = createState();
  cast(s, 'CC');
  cast(s, 'SW');
  cast(s, 'YH');
  advanceTime(s, 5000);
  expect(getCooldown(s, 'YH')).toBeCloseTo(25000, 0);
});

