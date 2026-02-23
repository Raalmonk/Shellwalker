import { SkillBlueprint } from './types';

export const WW_SKILLS: SkillBlueprint[] = [
  // ==========================================
  // 🟢 基础循环 (Baseline - 永远显示)
  // ==========================================
  { id: 'TP', name: '猛虎掌', icon: 'ability_monk_tigerpalm', gcdType: 'locked_1s', baseCooldown: 0, isChanneled: false, cdHasteScaled: false },
  { id: 'BoK', name: '幻灭踢', icon: 'ability_monk_roundhousekick', gcdType: 'locked_1s', baseCooldown: 3, isChanneled: false, cdHasteScaled: true },
  { id: 'RSK', name: '旭日踢', icon: 'ability_monk_risingsunkick', gcdType: 'locked_1s', baseCooldown: 12, isChanneled: false, cdHasteScaled: true },
  { id: 'FoF', name: '怒雷破', icon: 'ability_monk_fistsoffury', gcdType: 'haste_scaled', baseCooldown: 24, isChanneled: true, cdHasteScaled: true },
  { id: 'SCK', name: '神鹤引项踢', icon: 'ability_monk_spinningcranekick', gcdType: 'locked_1s', baseCooldown: 0, isChanneled: true, cdHasteScaled: false },
  { id: 'ToD', name: '轮回之触', icon: 'ability_monk_touchofdeath', gcdType: 'locked_1s', baseCooldown: 180, isChanneled: false, cdHasteScaled: false },

  // ==========================================
  // 🟡 天赋专属 (Talent Required - 动态显隐)
  // ==========================================
  { id: 'WDP', name: '升龙霸', icon: 'ability_monk_whirlingdragonpunch', gcdType: 'locked_1s', baseCooldown: 24, isChanneled: false, cdHasteScaled: true, requiredTalent: 'wdp' },
  { id: 'Xuen', name: '白虎雪怒', icon: 'inv_pet_xuen', gcdType: 'locked_1s', baseCooldown: 120, isChanneled: false, cdHasteScaled: false, requiredTalent: 'xuen' }
];