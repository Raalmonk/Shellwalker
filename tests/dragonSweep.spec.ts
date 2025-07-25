import { describe, it, expect, beforeEach } from 'vitest';
import { createState, cast, advanceTime, selectRemainingCd } from '../src/logic/dynamicEngine';

let s: ReturnType<typeof createState>;

beforeEach(() => {
  s = createState();
});

describe('dragon sweep tick rate', () => {
  it('SW+AA gives 3.0625\u00d7 tick rate', () => {
    cast(s, 'SW');
    cast(s, 'AA');
    cast(s, 'YH');
    advanceTime(s, 4000);
    expect(selectRemainingCd(s, 'YH')).toBeCloseTo(30000 - 4000 * 3.0625, 0);
  });

  it('SW+CC gives 4.375\u00d7 tick rate', () => {
    s = createState();
    cast(s, 'SW');
    cast(s, 'CC');
    cast(s, 'YH');
    advanceTime(s, 2000);
    expect(selectRemainingCd(s, 'YH')).toBeCloseTo(30000 - 2000 * 4.375, 0);
  });
});
