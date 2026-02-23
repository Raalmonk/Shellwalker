// 🌟 核心：GCD 类别直接决定了后续在右侧时间轴上画多宽
export type GcdType = 'locked_1s' | 'haste_scaled' | 'fixed_0.4s' | 'off_gcd';

export interface SkillBlueprint {
  id: string;
  name: string;
  icon: string;             // UI 图标名称 (例如 Wowhead 的 icon 名称)
  
  // --- MVP 要求的 4 大物理属性 ---
  gcdType: GcdType;
  baseCooldown: number;     // 基础冷却(秒)，0代表无CD
  isChanneled: boolean;     // 是否引导/读条 (决定时间轴是否有条纹 UI)
  cdHasteScaled: boolean;   // 冷却时间是否吃急速缩减
  
  // --- 天赋系统 ---
  requiredTalent?: string;  // 如果有值，必须点出该天赋才在左侧显示
}

// UI 视图专属数据结构 (由状态机动态计算得出，直接喂给前端框架渲染)
export interface SkillView extends SkillBlueprint {
  isVisible: boolean;        // 天赋是否允许它显示
  isReady: boolean;          // 是否可用 (决定是否灰显)
  remainsCd: number;         // 距离真正转好还剩几秒 (UI 可用来画倒计时遮罩)
  lockReason?: string;       // 变灰的原因 (比如 "需要前置技能")
}