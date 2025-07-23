export interface SkillCast {
  id: string;
  start: number;   // 秒
  base: number;    // 秒
  haste?: number;  // snapshot haste multiplier
}
