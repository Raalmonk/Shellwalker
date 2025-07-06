import { ratingToHaste, effTime } from './haste';

export const getSpell = (id: number, rating = 0) => {
  const s = DB[id];
  const haste = ratingToHaste(rating);     // ← 新算法
  const gcd = 1;                           // 踏风固定 1s
  const castEff = effTime(s.cast ?? 0, haste, 0);
  return { ...s, gcd, castEff };
};
