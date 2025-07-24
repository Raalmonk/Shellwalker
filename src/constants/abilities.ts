export interface Ability {
  id: string;
  cooldownMs: number;
  snapshot?: boolean;
}

export const ABILITIES: Record<string, Ability> = {
  AA: { id: 'AA', cooldownMs: 30000 },
  SW: { id: 'SW', cooldownMs: 30000 },
  YH: { id: 'YH', cooldownMs: 30000 },
  FoF: { id: 'FoF', cooldownMs: 24000, snapshot: true },
  RSK: { id: 'RSK', cooldownMs: 10000, snapshot: true },
  WU: { id: 'WU', cooldownMs: 25000, snapshot: true },
  BL: { id: 'BL', cooldownMs: 0 },
};

export function abilityById(id: string): Ability {
  const a = ABILITIES[id];
  if (!a) throw new Error(`unknown ability ${id}`);
  return a;
}
