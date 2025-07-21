export interface SkillEvent {
  start: number;
  end: number;
  kind?: 'AA' | 'CW' | 'CC' | 'BLESS';
  key?: string;
  [k: string]: any;
}

function kindOf(b: SkillEvent): 'AA' | 'CW' | 'CC' | 'BLESS' | undefined {
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

export function applyMutualExclusion<T extends SkillEvent>(
  events: T[],
  now: number,
): T[] {
  const ccStart = events.some(e => kindOf(e) === 'CC' && e.start === now);
  const ccActive = events.some(
    e => kindOf(e) === 'CC' && e.start <= now && now < e.end,
  ) || ccStart;

  const out: T[] = [];
  for (const ev of events) {
    const k = kindOf(ev);
    if (k === 'AA') {
      if (ccStart && ev.start < now && ev.end > now) {
        out.push({ ...(ev as T), end: now });
        out.push({ start: now, end: now + 4, kind: 'BLESS' } as T);
        continue;
      }
      if (ccActive && ev.start === now) {
        out.push({ start: now, end: now + 4, kind: 'BLESS' } as T);
        continue;
      }
    }
    out.push(ev);
  }
  return out;
}

// END_PATCH
