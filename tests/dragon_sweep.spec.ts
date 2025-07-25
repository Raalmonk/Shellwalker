import { describe, it, expect } from 'vitest';
import { createState, cast, advanceTime, getCooldown } from '../src/logic/dynamicEngine';

it('SW+AA gives 3.0625× tick rate', () => {
  const s = createState();
  cast(s, 'SW');
  cast(s, 'AA');
  cast(s, 'YH');
  advanceTime(s, 4000);
  expect(getCooldown(s, 'YH')).toBeCloseTo(30000 - 4000 * 3.0625, 0);
});

it('SW+CC gives 4.375× tick rate', () => {
  const s = createState();
  cast(s, 'SW');
  cast(s, 'CC');
  cast(s, 'YH');
  advanceTime(s, 2000);
  expect(getCooldown(s, 'YH')).toBeCloseTo(30000 - 2000 * 4.375, 0);
});

