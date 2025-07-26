export interface Buff { key: string; start: number; end: number }

export function getOriginalChiCost(key: string): number {
  switch (key) {
    case 'TP': return 0;
    case 'BOK': return 1;
    case 'RSK': return 2;
    case 'FoF': return 3;
    case 'SCK': return 2;
    case 'AA': return 2;
    case 'BLK_HL': return 1;
    case 'SCK_HL': return 2;
    default: return 0;
  }
}

export function getActualChiCost(key: string, buffs: Buff[], now: number): number {
  if (key === 'BLK_HL' || key === 'SCK_HL') return 0;
  const orig = getOriginalChiCost(key);
  const sefActive = buffs.some(b => b.key === 'SEF' && b.end > now);
  return sefActive && orig > 0 ? Math.max(0, orig - 1) : orig;
}
