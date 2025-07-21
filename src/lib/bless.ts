import type { Buff } from './speed';

function kindOf(b: any): Buff['kind'] | undefined {
  if (b.kind) return b.kind;
  switch (b.key) {
    case 'AA_BD':
      return 'AA';
    case 'SW_BD':
      return 'CW';
    case 'CC_BD':
      return 'CC';
    case 'Blessing':
      return 'BLESS';
    default:
      return undefined;
  }
}

export function autoBless(buffs: Buff[]): Buff[] {
  const out: Buff[] = buffs.slice();
  buffs.forEach(b => {
    const k = kindOf(b);
    if (k === 'AA' || k === 'CC' || k === 'CW') {
      out.push({ kind: 'BLESS', start: b.end, end: b.end + 4 });
    }
  });
  return out;
}

// END_PATCH
