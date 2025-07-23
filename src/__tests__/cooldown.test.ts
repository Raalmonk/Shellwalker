import { describe, expect, it } from 'vitest';
import { cdEnd } from '../lib/cooldown';
import { cdSpeedAt } from '../lib/speed';
import { hasteAt, HasteBuff as BuffRec } from '../lib/haste';

const ql: BuffRec[] = [{ key: 'AA_BD', start: 0, end: 6 }];

describe('cdEnd integration', () => {
  it('FoF ends at 19.5 s', () => {
    const end = cdEnd(0, 24, ql, (t, b) => cdSpeedAt(t, b));
    expect(end).toBeCloseTo(19.5, 1);
  });

  it('AA ends at 25.5 s', () => {
    const end = cdEnd(0, 30, ql, (t, b) => cdSpeedAt(t, b) * hasteAt(t, b));
    expect(end).toBeCloseTo(25.5, 1);
  });
});
