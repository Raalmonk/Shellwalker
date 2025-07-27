import spells from '../data/monk_spells.json';
import { ratingToHaste, effTime } from './haste';

interface Spell {
  id: number;
  name: string;
  gcd?: number;
  cast?: number;
  power_cost?: { energy?: number; chi?: number };
  cooldown?: number;
  charges?: number;
  family?: string;
}

// 👇 唯一的映射变量叫 MAP
const MAP = Object.fromEntries(
  (spells as Spell[]).map(s => [s.id, s])
);

/**
 * 取得技能并根据急速计算 Cast/GCD
 */
export const getSpell = (id: number, rating = 0) => {
  const s = MAP[id] as Spell | undefined;
  if (!s) {
    throw new Error(`❌ Spell id ${id} not found in monk_spells.json`);
  }
  const haste = ratingToHaste(rating);
  const baseGCD = s.gcd ?? 1;
  const gcd = baseGCD === 0 ? 0 : 1; // respect non-GCD abilities
  const castEff = effTime(s.cast ?? 0, haste, 0);
  return { ...s, gcd, castEff };
};
