export interface SkillBlueprint {
  id: string;
  name: string;
  icon: string;             
  requiredTalent?: string;  
  canCallBuff?: boolean;
}