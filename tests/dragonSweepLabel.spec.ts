import { describe, it, expect } from 'vitest';
import { cdSpeedAt } from '../src/lib/speed';

const mk = (s:number,d:number,k:string)=>({start:s,end:s+d,kind:k});

describe('dragon sweep label', () => {
  it('AA+SW shows +2.06', () => {
    const rate = cdSpeedAt(2, [mk(0,6,'AA'), mk(0,8,'CW')]);
    const extra = (rate - 1).toFixed(2);
    expect(extra).toBe('2.06');
  });

  it('CC+SW shows +3.38', () => {
    const rate = cdSpeedAt(2, [mk(0,6,'CC'), mk(0,8,'CW')]);
    const extra = (rate - 1).toFixed(2);
    expect(extra).toBe('3.38');
  });
});
