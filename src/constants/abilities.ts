export interface Ability {
  id: string;
  cooldown: number; // ms
  snapshot?: boolean;
}

export const ABILITIES: Record<string, Ability> = {
  AA: { id: 'AA', cooldown: 30000 },
  SW: { id: 'SW', cooldown: 30000 },
  YH: { id: 'YH', cooldown: 30000 },
  FoF: { id: 'FoF', cooldown: 24000, snapshot: true },
  RSK: { id: 'RSK', cooldown: 10000, snapshot: true },
  WU: { id: 'WU', cooldown: 25000, snapshot: true },
  BL: { id: 'BL', cooldown: 0 },
};

export function abilityById(id: string): Ability {
  const a = ABILITIES[id];
  if (!a) throw new Error(`ability ${id} not found`);
  return a;
}
