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

export function blessLayersAt(t: number, buffs: Buff[]): number {
  const cw = active(t, buffs, 'CW') ? 1 : 0;
  const cc = active(t, buffs, 'CC');
  const aa = active(t, buffs, 'AA');
  const bless = count(t, buffs, 'BLESS');
  return bless + cw + (cc ? 1 : aa ? 1 : 0);
}

export function cdSpeedAt(t: number, buffs: Buff[]): number {
  const cw = active(t, buffs, 'CW');
  const cc = active(t, buffs, 'CC');
  const aa = active(t, buffs, 'AA');

  let extra = 0;
  if (cc) extra = 1.5;
  else if (aa) extra = 0.75;

  if (cw) {
    if (extra) extra *= 1.75;
    else extra = 0.75;
  }

  let speed = 1 + extra;
  speed *= Math.pow(1.15, blessLayersAt(t, buffs));
  return speed;
}

// END_PATCH
