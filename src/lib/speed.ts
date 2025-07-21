export interface Buff {
  start: number;
  end: number;
  kind: 'AA' | 'CC' | 'CW' | 'BLESS';
}

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

const active = (t: number, buffs: any[], k: Buff['kind']) =>
  buffs.some(b => kindOf(b) === k && b.start <= t && t < b.end);

const count = (t: number, buffs: any[], k: Buff['kind']) =>
  buffs.filter(b => kindOf(b) === k && b.start <= t && t < b.end).length;

export function cdSpeedAt(t: number, buffs: Buff[]): number {
  const hasCW = active(t, buffs, 'CW');
  const hasCC = active(t, buffs, 'CC');
  const hasAA = !hasCC && active(t, buffs, 'AA');

  const extra = hasCC ? 1.5 : hasAA ? 0.75 : 0;

  let speed = 1 + extra;
  if (hasCW) {
    speed = hasAA || hasCC ? 1 + extra * 1.75 : 1 + 0.75;
  }

  const dragonStacks = (hasCW ? 1 : 0) + (hasCC ? 1 : 0) + (hasAA ? 1 : 0);
  const blessStacks = count(t, buffs, 'BLESS') + dragonStacks;
  if (blessStacks > 0) speed *= Math.pow(1.15, blessStacks);

  return speed;
}

// END_PATCH
