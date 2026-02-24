export type GcdType = 'off_gcd' | 'locked_1s' | 'fixed_0.4s' | 'haste_scaled';

export interface SkillBlueprint {
  id: string;
  name: string;
  icon: string;
  requiredTalent?: string;
  canCallBuff?: boolean;
  gcdType?: GcdType;
  baseCastTime?: number;
  baseCooldown?: number;
  cdHasteScaled?: boolean;
  replacesId?: string;
}

export interface SkillView extends SkillBlueprint {
  isVisible: boolean;
  isReady: boolean;
  remainsCd: number;
  lockReason?: string;
  isHighlighted?: boolean;
}
