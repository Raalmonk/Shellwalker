export interface Buff {
  start: number;
  end: number;
  kind: 'AA' | 'CW' | 'CC';
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
    default:
      return undefined;
  }
}

const active = (t: number, buffs: any[], k: Buff['kind']) =>
  buffs.some(b => kindOf(b) === k && b.start <= t && t < b.end);

/**
 * 计算当前时间 t 下，所有 Buff 对 CD 的加速倍数
 * 规则：
 *   - 基础 speed = 1
 *   - aaActive = buffs 中有 kind==='AA'
 *   - ccActive = buffs 中有 kind==='CC'
 *   - cwActive = buffs 中有 kind==='CW'
 *   - 若 ccActive 且 aaActive，忽略 AA（AA 被 CC 覆盖）
 *   - extra = 0
 *   - if (cwActive && ccActive) extra = 1.5 * 1.75
 *   - else if (cwActive && aaActive) extra = 0.75 * 1.75
 *   - else if (ccActive)                extra = 1.5
 *   - else if (aaActive || cwActive)    extra = 0.75
 *   - speed = 1 + extra
 *   - return speed
 */
export function cdSpeedAt(t: number, buffs: Buff[]): number {
  const aaActive = active(t, buffs, 'AA');
  const ccActive = active(t, buffs, 'CC');
  const cwActive = active(t, buffs, 'CW');

  // CC overrides AA when both present
  const aa = ccActive ? false : aaActive;

  let extra = 0;
  if (cwActive && ccActive) extra = 1.5 * 1.75;
  else if (cwActive && aa) extra = 0.75 * 1.75;
  else if (ccActive) extra = 1.5;
  else if (aa || cwActive) extra = 0.75;

  return 1 + extra;
}

// END_PATCH
