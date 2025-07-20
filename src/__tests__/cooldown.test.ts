import { describe, it, expect } from 'vitest';
import { startSkill, tick, removeSkill, simulate, Skill } from '../logic/cooldown';

const WU: Skill = { id: 'WU', castTime: 500, cooldown: 8000 };
const AA: Skill = { id: 'AA', castTime: 1000, cooldown: 5000 };

describe('cooldown utilities', () => {
  it('handles cast time deduction when chaining', () => {
    let cd = startSkill({}, WU);
    cd = tick(cd, 500);
    cd = startSkill(cd, AA);
    expect(cd['WU']).toBe(7000);
  });

  it('removes skill before cooldown ends', () => {
    let cd = startSkill({}, WU);
    cd = tick(cd, 3000); // WU -> 5500
    cd = removeSkill(cd, 'WU');
    expect(cd['WU']).toBeUndefined();
  });

  it('simulate entire timeline', () => {
    const timeline = simulate(
      [
        { t: 0, op: 'start', skill: WU },
        { t: 500, op: 'start', skill: AA },
        { t: 2500, op: 'remove', id: 'AA' },
      ],
      10000,
      1000,
    );
    expect(timeline).toMatchInlineSnapshot(`
      [
        {
          "cd": {
            "WU": 8500,
          },
          "t": 0,
        },
        {
          "cd": {
            "AA": 5500,
            "WU": 6500,
          },
          "t": 1000,
        },
        {
          "cd": {
            "AA": 4500,
            "WU": 5500,
          },
          "t": 2000,
        },
        {
          "cd": {
            "WU": 4500,
          },
          "t": 3000,
        },
        {
          "cd": {
            "WU": 3500,
          },
          "t": 4000,
        },
        {
          "cd": {
            "WU": 2500,
          },
          "t": 5000,
        },
        {
          "cd": {
            "WU": 1500,
          },
          "t": 6000,
        },
        {
          "cd": {
            "WU": 500,
          },
          "t": 7000,
        },
        {
          "cd": {},
          "t": 8000,
        },
        {
          "cd": {},
          "t": 9000,
        },
        {
          "cd": {},
          "t": 10000,
        },
      ]
    `);
  });
});

// END_PATCH
