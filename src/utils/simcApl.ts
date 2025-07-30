export function toSimcName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .trim()
    .replace(/\s+/g, '_');
}

export interface AplItem {
  ability: string;
  start: number;
}

const SIMC_NAME_MAP: Record<string, string> = {
  TP: 'tiger_palm',
  FoF: 'fists_of_fury',
  RSK: 'rising_sun_kick',
  RSK_HL: 'rising_sun_kick',
  BLK: 'blackout_kick',
  BOK: 'blackout_kick',
  BOK_HL: 'blackout_kick',
  WU: 'whirling_dragon_punch',
  AA: 'strike_of_the_windlord',
  SW: 'slicing_winds',
  SEF: 'storm_earth_and_fire',
  Xuen: 'invoke_xuen_the_white_tiger',
  CC: 'celestial_conduit',
  SCK: 'spinning_crane_kick',
  SCK_HL: 'spinning_crane_kick',
};

export function exportSimcApl(
  items: AplItem[],
  nameMap: Record<string, { name?: string }>,
): string {
  const sorted = [...items].sort((a, b) => a.start - b.start);
  let out = '';
  let prev = 0;
  sorted.forEach((it, idx) => {
    let simc = SIMC_NAME_MAP[it.ability];
    if (!simc) {
      const entryName = nameMap[it.ability]?.name;
      if (!entryName) {
        throw new Error(`Unsupported ability ${it.ability}`);
      }
      simc = toSimcName(entryName);
    }
    if (idx === 0) {
      out += `actions+=/${simc}\n`;
    } else {
      const diff = Number((it.start - prev).toFixed(3));
      if (diff > 0) out += `actions+=/wait,sec=${diff}\n`;
      out += `actions+=/${simc}\n`;
    }
    prev = it.start;
  });
  return out.trim();
}
