export interface Ability {
  id: string;
  cooldownMs: number;
  snapshot?: boolean;
}

export const abilityMap: Record<string, Ability> = {
  BL: { id: 'BL', cooldownMs: 0 },
  AA: { id: 'AA', cooldownMs: 30_000 },
  SW: { id: 'SW', cooldownMs: 30_000 },
  YH: { id: 'YH', cooldownMs: 30_000 },
  FoF: { id: 'FoF', cooldownMs: 24_000, snapshot: true },
  RSK: { id: 'RSK', cooldownMs: 10_000, snapshot: true },
  WU: { id: 'WU', cooldownMs: 25_000, snapshot: true },
};

export function abilityById(id: string): Ability {
  return abilityMap[id];
}
