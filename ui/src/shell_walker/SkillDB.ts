import type { SkillBlueprint } from './types';

export const WW_SKILLS: SkillBlueprint[] = [
  { id: 'TP', name: '猛虎掌', icon: 'ability_monk_tigerpalm', gcdType: 'locked_1s', baseCooldown: 0, baseCastTime: 0 },
  { id: 'BoK', name: '幻灭踢', icon: 'ability_monk_roundhousekick', canCallBuff: true, gcdType: 'locked_1s', baseCooldown: 0, baseCastTime: 0 },
  { id: 'RSK', name: '旭日踢', icon: 'ability_monk_risingsunkick', canCallBuff: true, gcdType: 'locked_1s', baseCooldown: 10, baseCastTime: 0 },
  { id: 'FoF', name: '怒雷破', icon: 'ability_monk_fistsoffury', gcdType: 'haste_scaled', baseCooldown: 24, baseCastTime: 4 },
  { id: 'SCK', name: '神鹤引项踢', icon: 'ability_monk_spinningcranekick', canCallBuff: true, gcdType: 'locked_1s', baseCooldown: 0, baseCastTime: 0 },
  { id: 'SotWL', name: '风领主之击', icon: 'ability_monk_strikeofthewindlord', requiredTalent: 'strike_of_the_windlord', gcdType: 'locked_1s', baseCooldown: 30, baseCastTime: 0 },
  { id: 'WDP', name: '升龙霸', icon: 'ability_monk_whirlingdragonpunch', requiredTalent: 'whirling_dragon_punch', gcdType: 'locked_1s', baseCooldown: 24, baseCastTime: 0 },
  { id: 'Xuen', name: '白虎雪怒', icon: 'inv_pet_xuen', gcdType: 'off_gcd', baseCooldown: 120, baseCastTime: 0 },
  { id: 'ToD', name: '轮回之触', icon: 'ability_monk_touchofdeath', gcdType: 'locked_1s', baseCooldown: 120, baseCastTime: 0 }
];
