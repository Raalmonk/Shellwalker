import { describe, it, expect } from 'vitest';
import { roundToGridMs, getNextAvailableCastTime } from '../src/utils/timeline';
import type { Plan } from '../src/utils/timeline';
import { getEndAt } from '../src/utils/getEndAt';

function cast(id: string, start: number, base: number) {
  return { id, start, base };
}

describe('timeline helpers', () => {
  it('rounds drag position to 0.1s', () => {
    expect(roundToGridMs(850)).toBe(900);
  });

  it('right click then left click clears pending flag', () => {
    let ev = { id: 1, ability: 'AA', group: 1, start: 0, label: 'a', pendingDelete: false };
    // right click
    ev.pendingDelete = !ev.pendingDelete;
    // left click should toggle off
    ev.pendingDelete = !ev.pendingDelete;
    expect(ev.pendingDelete).toBe(false);
  });

  it('snap to cooldown end when overlapping', () => {
    const plan: Plan = {
      casts: { AA: [cast('1', 0, 1)] },
      buffs: [],
    };
    const start = getNextAvailableCastTime('AA', 0.5, plan);
    const end = getEndAt(plan.casts.AA[0], plan.buffs);
    expect(start).toBeGreaterThanOrEqual(end);
  });
});
