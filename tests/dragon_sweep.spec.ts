import { describe, it, expect, beforeEach } from 'vitest';
import {
  createState,
  cast,
  advanceTime,
  selectRemainingCd,
} from '../src/logic/dynamicEngine';

let store: ReturnType<typeof createState>;

beforeEach(() => {
  store = createState();
});

describe('dragon sweep cooldown', () => {
  it('AA+SW sweeps 2.0625s CD per real second', () => {
    cast(store, 'AA');
    cast(store, 'SW');
    cast(store, 'YH');
    advanceTime(store, 4000);
    const rem = selectRemainingCd(store, 'YH');
    const expectedBurn = 4000 * 3.0625;
    expect(rem).toBeCloseTo(30000 - expectedBurn, 0);
  });

  it('CC+SW sweeps 3.375s CD per real second', () => {
    store = createState();
    cast(store, 'CC');
    cast(store, 'SW');
    cast(store, 'YH');
    advanceTime(store, 4000);
    const rem = selectRemainingCd(store, 'YH');
    const expectedBurn = 4000 * 4.375;
    expect(rem).toBeCloseTo(30000 - expectedBurn, 0);
  });
});
