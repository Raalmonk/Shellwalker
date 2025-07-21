import type { Buff } from './cooldown';

// Buff: { start:number; end:number; kind:'AA'|'CW'|'CC'|'BLESS' }
type Kind = 'AA' | 'CW' | 'CC' | 'BLESS';

function kindOf(b: any): Kind | undefined {
  if (b.kind) return b.kind as Kind;
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

const active = (t: number, buffs: any[], k: Kind) =>
  buffs.some(b => kindOf(b) === k && b.start <= t && t < b.end);

const count = (t: number, buffs: any[], k: Kind) =>
  buffs.filter(b => kindOf(b) === k && b.start <= t && t < b.end).length;

export function cdSpeedAt(t: number, buffs: Buff[]): number {
  const aa = active(t, buffs, 'AA');
  const cw = active(t, buffs, 'CW');
  const cc = active(t, buffs, 'CC');

  let extra = 0;
  if (cc) extra = 1.5;
  else if (aa) extra = 0.75;

  if (cw) {
    if (cc) extra = 1.5 * 1.75;
    else if (aa) extra = 0.75 * 1.75;
    else extra = 0.75;
  }

  const dragonSpeed = 1 + extra;

  const n =
    count(t, buffs, 'BLESS') + (aa ? 1 : 0) + (cw ? 1 : 0) + (cc ? 1 : 0);

  return dragonSpeed * Math.pow(1.15, n);
}

// END_PATCH
