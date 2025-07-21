export interface Buff {
  start: number;
  end: number;
  kind: 'AA' | 'CW' | 'CC' | 'BLESS';
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
  const hasAA = active(t, buffs, 'AA');
  const stacks = count(t, buffs, 'BLESS');

  let extraOther = 0;
  if (hasCC) extraOther = 1.5;
  else if (hasAA) extraOther = 0.75;

  let speed = 1;

  if (hasCW) {
    speed = extraOther > 0 ? 1 + extraOther * 1.75 : 1 + 0.75;
  } else {
    speed = 1 + extraOther;
  }

  if (stacks > 0) speed *= 1.15 * stacks;

  return speed;
}

// END_PATCH
