import type { SkillBlueprint } from './types';

export const WW_SKILLS: SkillBlueprint[] = [
  { id: 'TP', name: '猛虎掌', icon: 'ability_monk_tigerpalm' },
  { id: 'BoK', name: '幻灭踢', icon: 'ability_monk_roundhousekick', canCallBuff: true },
  { id: 'RSK', name: '旭日踢', icon: 'ability_monk_risingsunkick', canCallBuff: true },
  { id: 'FoF', name: '怒雷破', icon: 'ability_monk_fistsoffury' },
  { id: 'SCK', name: '神鹤引项踢', icon: 'ability_monk_spinningcranekick', canCallBuff: true },
  { id: 'SotWL', name: '风领主之击', icon: 'ability_monk_strikeofthewindlord', requiredTalent: 'strike_of_the_windlord' },
  { id: 'WDP', name: '升龙霸', icon: 'ability_monk_whirlingdragonpunch', requiredTalent: 'whirling_dragon_punch' },
  { id: 'Xuen', name: '白虎雪怒', icon: 'inv_pet_xuen' },
  { id: 'ToD', name: '轮回之触', icon: 'ability_monk_touchofdeath' }
];