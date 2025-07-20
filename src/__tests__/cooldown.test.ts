import { describe, it, expect } from 'vitest';
import { startSkill, tick, removeSkill, Skill } from '../logic/cooldown';

const WU: Skill = { id: 'WU', castTime: 500, cooldown: 8000 };
const AA: Skill = { id: 'AA', castTime: 1000, cooldown: 5000 };

describe('cooldown utilities', () => {
  it('deducts cast time from existing cooldowns', () => {
    let cd = startSkill({}, WU); // WU -> 8500
    cd = tick(cd, 500); // WU -> 8000
    cd = startSkill(cd, AA); // should deduct 1000 from WU
    expect(cd.WU).toBe(7000);
    expect(cd.AA).toBe(6000);
  });

  it('removeSkill deletes cooldown entry', () => {
    let cd = startSkill({}, WU);
    cd = removeSkill(cd, 'WU');
    expect(cd.WU).toBeUndefined();
  });

  it('applyElapsed prevents negatives', () => {
    let cd = startSkill({}, WU);
    cd = tick(cd, 9000);
    expect(cd.WU).toBeUndefined();
  });
});

// END_PATCH
