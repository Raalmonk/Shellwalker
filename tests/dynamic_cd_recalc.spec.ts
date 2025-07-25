import { describe, it, expect, beforeEach } from 'vitest';
import { createState, cast, advanceTime, setGearRating, getCooldown } from '../src/logic/dynamicEngine';

let s: ReturnType<typeof createState>;
const RATING_50 = 35829; // ~= 50% haste

beforeEach(() => {
  s = createState();
});

describe('dynamic cooldown recomputation', () => {
  it('gear haste slider instantly updates remaining CD', () => {
    cast(s, 'YH');
    advanceTime(s, 10000);
    expect(getCooldown(s, 'YH')).toBeCloseTo(20000, 0);
    setGearRating(s, RATING_50); // from now on haste 1.5x
    expect(getCooldown(s, 'YH')).toBeCloseTo(20000, 0);
    advanceTime(s, 5000);
    expect(getCooldown(s, 'YH')).toBeCloseTo(12500, 0);
  });

  it('retro drag of Bloodlust alters past integration', () => {
    cast(s, 'YH');
    advanceTime(s, 5000);
    cast(s, 'BL'); // BL starts at t=5s
    advanceTime(s, 5000); // now t=10s
    const original = getCooldown(s, 'YH');
    // shift BL 5s earlier so it covers t=0-40s
    s.buffs[0].start -= 5000;
    s.buffs[0].end -= 5000;
    expect(getCooldown(s, 'YH')).toBeLessThanOrEqual(original - 5000 * 0.3);
  });

  it('AA+SW overlap sweep integrates 3.0625× section', () => {
    cast(s, 'AA');
    cast(s, 'SW');
    cast(s, 'YH');
    advanceTime(s, 25000);
    expect(getCooldown(s, 'YH')).toBeCloseTo(0, 0);
  });
});
