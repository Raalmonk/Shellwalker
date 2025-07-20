import { describe, expect, it } from 'vitest';
import { Skill, startSkill, advance, timeline } from '../logic/cooldown';

const AA: Skill = { id: 'AA', castTime: 0, cooldown: 30000 };
const QL: Skill = { id: 'QL', castTime: 0, cooldown: 0 };

describe('Cooldown – absolute timestamp model', () => {
  it('AA should be ready at 25.5 s, not 17.1 s', () => {
    let cd = startSkill({}, AA, 0);
    cd = advance(cd, 0, 4500);
    expect(cd.AA - 4500).toBe(25500);
  });

  it('timeline produces correct per-1000ms snapshot', () => {
    const shots = timeline(
      {},
      [
        { t: 0, op: 'start', skill: AA },
        { t: 0, op: 'start', skill: QL },
        { t: 4500, op: 'remove', id: 'QL' },
      ],
      30000,
      1000,
    );
    expect(shots[5].cd.AA - shots[5].t).toBeGreaterThan(24999);
    expect(shots[5].cd.AA - shots[5].t).toBeLessThan(25001);
  });
});
