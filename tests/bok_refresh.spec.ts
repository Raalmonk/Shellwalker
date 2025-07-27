import { describe, it, expect } from 'vitest';
import { cdEnd, reduceCd } from '../src/lib/cooldown';
import { cdSpeedAt } from '../src/lib/speed';

const mk = (key: string, start: number, end: number) => ({ key, start, end } as any);

function afterRefresh(buffs: any[], at: number, base=24) {
  const cast = { id:'FoF', start:0, base };
  const origEnd = cdEnd(cast.start, cast.base, buffs, cdSpeedAt);
  const amt = cdSpeedAt(at, buffs);
  const upd = reduceCd(cast, at, amt, buffs, cdSpeedAt);
  const end = cdEnd(upd.start, upd.base, buffs, cdSpeedAt);
  return { origEnd, end };
}

describe('BOK cooldown refresh', () => {
  it('reduces by 1s without buffs', () => {
    const { origEnd, end } = afterRefresh([], 2);
    expect(origEnd).toBe(24);
    expect(end).toBeCloseTo(23, 3);
  });

  it('scales with SW buff', () => {
    const sw = mk('SW_BD',0,8);
    const { end } = afterRefresh([sw], 2);
    expect(end).toBeCloseTo(16.25, 2);
  });

  it('scales with SW+AA', () => {
    const sw = mk('SW_BD',0,8);
    const aa = mk('AA_BD',0,6);
    const { end } = afterRefresh([sw,aa], 2);
    expect(end).toBeCloseTo(7.0625, 3);
  });
});
