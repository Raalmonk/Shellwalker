export interface SkillEvent {
  start: number;
  end: number;
  kind?: 'AA' | 'CW' | 'CC' | 'BLESS';
  key?: string;
}

function kindOf(e: SkillEvent): SkillEvent['kind'] | undefined {
  if (e.kind) return e.kind;
  switch (e.key) {
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

/**
 * Handle CC>AA mutual exclusion and AA during CC.
 * Return a new event array with adjustments applied.
 */
export function applyMutualExclusion(events: SkillEvent[], now: number): SkillEvent[] {
  let out = events.map(e => ({ ...e }));

  const active = (k: SkillEvent['kind']) =>
    out.find(b => kindOf(b) === k && b.start <= now && now < b.end);

  const newAAIdx = out.findIndex(b => kindOf(b) === 'AA' && b.start === now);
  const newCCIdx = out.findIndex(b => kindOf(b) === 'CC' && b.start === now);

  const ccActive = active('CC');
  const aaActive = active('AA');

  if (newCCIdx !== -1 && aaActive) {
    out = out.map(b =>
      kindOf(b) === 'AA' && b.start <= now && now < b.end ? { ...b, end: now } : b,
    );
    out.push({ start: now, end: now + 4, kind: 'BLESS' });
  }

  if (newAAIdx !== -1 && (ccActive || newCCIdx !== -1)) {
    out.splice(newAAIdx, 1); // remove AA buff
    out.push({ start: now, end: now + 4, kind: 'BLESS' });
  }

  return out;
}

// END_PATCH
