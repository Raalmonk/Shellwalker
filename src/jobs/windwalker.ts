import { getSpell } from '../lib/spell-db';

export const WW = {
  Xuen: 123904,
  SEF: 137639,
  AA: 388201,
  SW: 392983,
  WU: 353947,
  CC: 999999,
  TP: 100780,
  BOK: 100784,
  RSK: 107428,
  FoF: 113656,
  BL: 999998,
  BLK_HL: 999997,
  SCK: 999996,
  SCK_HL: 999995,
} as const;

export type WWKey = keyof typeof WW;

const HASTED: WWKey[] = ['RSK', 'FoF', 'WU', 'SCK', 'SCK_HL'];

export const wwData = (haste: number) =>
  Object.fromEntries(
    Object.entries(WW).map(([k, id]) => {
      const spell = getSpell(id, haste);
      return [
        k,
        {
          ...spell,
          affectedByHaste: HASTED.includes(k as WWKey),
          triggersGCD: spell.gcd !== 0,
        },
      ];
    })
  ) as Record<
    WWKey,
    ReturnType<typeof getSpell> & {
      affectedByHaste: boolean;
      triggersGCD: boolean;
    }
  >;
