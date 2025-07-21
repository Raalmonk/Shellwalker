import { describe, expect, it } from 'vitest';
import { cdEnd } from '../lib/cooldown';
import { cdSpeedAt } from '../lib/speed';
import { hasteAt, BuffRec } from '../App';

const ql: BuffRec[] = [{ key: 'AA_BD', start: 0, end: 6 }];

describe('cdEnd integration', () => {
  it('FoF ends at 17.925 s', () => {
    const end = cdEnd(0, 24, ql, (t, b) => cdSpeedAt(t, b));
    expect(end).toBeCloseTo(17.925, 3);
  });

  it('AA ends at 23.925 s', () => {
    const end = cdEnd(0, 30, ql, (t, b) => cdSpeedAt(t, b) * (1 + hasteAt(t, b)));
    expect(end).toBeCloseTo(23.925, 3);
  });
});
