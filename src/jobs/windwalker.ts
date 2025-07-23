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
} as const;

export type WWKey = keyof typeof WW;

export const wwData = (haste: number) =>
  Object.fromEntries(
    Object.entries(WW).map(([k, id]) => [k, getSpell(id, haste)])
  ) as Record<WWKey, ReturnType<typeof getSpell>>;
