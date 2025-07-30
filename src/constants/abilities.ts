import { TimelineRow } from './timelineRows';

export interface Ability {
  id: string;
  name?: string;
  iconKey?: string;
  cooldownMs: number;
  snapshot?: boolean;
  baseChannelMs?: number;
  channelDynamic?: boolean;
  /** Whether the ability triggers the global cooldown */
  triggersGCD?: boolean;
  row?: TimelineRow;
}

export const ABILITIES: Record<string, Ability> = {
  AA: { id: 'AA', cooldownMs: 30000 },
  SW: { id: 'SW', cooldownMs: 30000, baseChannelMs: 500, channelDynamic: false },
  YH: { id: 'YH', cooldownMs: 30000 },
  FoF: {
    id: 'FoF',
    cooldownMs: 24000,
    snapshot: true,
    baseChannelMs: 4000,
    channelDynamic: true,
  },
  RSK: { id: 'RSK', cooldownMs: 10000, snapshot: true },
  RSK_HL: { id: 'RSK_HL', cooldownMs: 10000, snapshot: true },
  WU: { id: 'WU', cooldownMs: 25000, snapshot: true },
  CC: { id: 'CC', cooldownMs: 90000, baseChannelMs: 1500, channelDynamic: true },
  BL: { id: 'BL', cooldownMs: 0 },
  TP: {
    id: 'TP',
    name: 'Tiger Palm',
    iconKey: 'TP',
    cooldownMs: 0,
    row: 'minorFiller',
  },
  SCK: {
    id: 'SCK',
    name: 'Spinning Crane Kick',
    iconKey: 'SCK',
    cooldownMs: 0,
    baseChannelMs: 1500,
    channelDynamic: true,
    row: 'minorFiller',
  },
  SCK_HL: {
    id: 'SCK_HL',
    name: 'Spinning Crane Kick HL',
    iconKey: 'SCK_HL',
    cooldownMs: 0,
    baseChannelMs: 1500,
    channelDynamic: true,
    row: 'minorFiller',
  },
  BOK_HL: {
    id: 'BOK_HL',
    name: 'Blackout Kick HL',
    iconKey: 'BOK_HL',
    cooldownMs: 0,
    baseChannelMs: 0,
    channelDynamic: false,
    row: 'minorFiller',
  },
};

export function abilityById(id: string): Ability {
  const a = ABILITIES[id];
  if (!a) throw new Error(`unknown ability ${id}`);
  return { ...a, triggersGCD: a.triggersGCD ?? true };
}
