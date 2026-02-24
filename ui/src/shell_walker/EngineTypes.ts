export interface StateSnapshot {
  t: number;
  gcd_until: number;
  channel_until: number;
  cooldowns: Record<string, number>;
}

export interface EngineEvent {
  type: 'WAIT' | 'CAST';
  spellId?: string;
  startT: number;
  duration: number;
  seqId?: string; // 🌟 唯一标记，用于精准单删积木！
}