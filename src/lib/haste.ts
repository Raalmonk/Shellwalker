/** 单个阶梯常量 */
const STEP = 6600;          // rating
const BASE_CONV = 660;      // 660 rating = 1% haste

/**
 * rating → haste(小数，0.25 = +25%)
 * - 前 19 800 rating 按 100 % 结算
 * - 之后每 6 600 rating 阶梯再减少 10 % 收益
 */
export function ratingToHaste(rating: number): number {
  let remaining = rating;
  let pct = 0;
  let tier = 0;

  // 段 0：前 19 800 rating 不打折
  const cap0 = 19800;
  const take0 = Math.min(remaining, cap0);
  pct += take0 / BASE_CONV;      // 100 % 效果
  remaining -= take0;

  // 之后每阶梯 6 600 rating
  while (remaining > 0) {
    const take = Math.min(remaining, STEP);
    const factor = Math.max(0, 1 - 0.1 * (tier + 1)); // 每阶梯 -10%
    pct += (take / BASE_CONV) * factor;
    remaining -= take;
    tier++;
  }

  return pct / 100;      // 返回小数：0.23 = +23 %
}

/** 施法 / GCD 缩短（floor = 0.75 默认 GCD 下限） */
export function effTime(base: number, hastePct: number, floor = 0.75) {
  if (!base) return 0;
  const t = base / (1 + hastePct);
  return base === 1 ? 1 : Math.max(t, floor); // 踏风 GCD 固定 1
}

export interface BuffEvent {
  id: string;
  name: string;
  startMs: number;
  endMs: number;
  multiplier: number;
  type: 'buff';
}

export function totalHasteAt(
  rating: number,
  buffs: BuffEvent[],
  t: number,
): number {
  const gear = 1 + ratingToHaste(rating);
  const buffMult = buffs
    .filter(b => b.startMs <= t && t < b.endMs)
    .reduce((m, b) => m * b.multiplier, 1);
  return gear * buffMult;
}
