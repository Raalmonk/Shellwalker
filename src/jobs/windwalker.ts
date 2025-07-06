import { getSpell } from '../lib/spell-db';

export const WW = {
  TP: 100780,
  BOK: 100784,
  RSK: 107428,
  FoF: 113656,
} as const;

export type WWKey = keyof typeof WW;

export const wwData = (haste: number) =>
  Object.fromEntries(
    Object.entries(WW).map(([k, id]) => [k, getSpell(id, haste)])
  ) as Record<WWKey, ReturnType<typeof getSpell>>;
