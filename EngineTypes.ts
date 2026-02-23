// ==========================================
// 📸 宇宙快照 (State Snapshot)
// ==========================================
export interface StateSnapshot {
  t: number;                  // 游标当前绝对时间戳 (秒)
  
  // --- 🟢 资源与属性 ---
  chi: number;                // 真气 (0-6)
  energy: number;             // 能量 (0-120)
  haste: number;              // 0.10 代表 10%
  crit: number;
  mastery: number;
  versatility: number;
  
  // --- 🔒 绝对时间锁 (Blockers) ---
  gcd_until: number;          // 当前公共冷却在此刻结束
  channel_until: number;      // 当前引导(如怒雷破)在此刻结束
  
  // 🌟 核心：记录技能【真正转好冷却的绝对时间戳】，而不是剩余几秒！
  cooldowns: Record<string, number>; 
  buffs: Record<string, { expires: number; stacks: number }>;

  // --- ⚠️ 踏风专属防呆状态 ---
  lastSpellCast: string | null;      // 连击防呆
  flurryCharges: number;             // 疾风乱打的“蓄水池”小数层数
}

export interface Action {
  spellId: string;            // 想要按下的技能 ID (例如 'RSK')
  calledProcs?: string[];     // 玩家在积木上勾选的“薛定谔触发” (MVP阶段先留空)
}

export interface EngineEvent {
  type: 'WAIT' | 'CAST' | 'ERROR';
  spellId?: string;           // WAIT/ERROR 时可为空
  startT: number;             // 在时间轴画布上的绝对 X 坐标
  duration: number;           // 占据时间轴的绝对宽度 (秒)
  chiDiff: number;            // 气变化 (用于 UI 飘字或槽加减)
  energyDiff: number;         // 能量变化 
  message?: string;           // 错误信息或发呆提示
}