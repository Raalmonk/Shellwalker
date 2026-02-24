import type { StateSnapshot, EngineEvent } from './EngineTypes';
import { WW_SKILLS } from './SkillDB';

export function simulateSequence(sequence: {id: string, spellId: string}[], haste: number) {
  const state: StateSnapshot = {
    t: 0, gcd_until: 0, channel_until: 0, cooldowns: {}
  };
  const events: EngineEvent[] = [];
  const currentHasteMult = 1 + haste;

  sequence.forEach((item) => {
    const spell = WW_SKILLS.find(s => s.id === item.spellId);
    if (!spell) return;

    // 1. 发呆留白判定 (前端只看CD，不再越权拦你真气！)
    let readyTime = state.t;
    if (spell.gcdType !== 'off_gcd') {
      readyTime = Math.max(readyTime, state.gcd_until, state.channel_until);
    }
    const cdReadyAt = state.cooldowns[spell.id] || 0;
    readyTime = Math.max(readyTime, cdReadyAt);

    const waitDuration = readyTime - state.t;
    if (waitDuration > 0.001) {
      events.push({ type: 'WAIT', startT: state.t, duration: waitDuration });
      state.t = readyTime;
    }

    // 2. 算耗时
    let realGcd = 0;
    if (spell.gcdType === 'locked_1s') realGcd = 1.0;
    else if (spell.gcdType === 'fixed_0.4s') realGcd = 0.4;
    else if (spell.gcdType === 'haste_scaled') realGcd = Math.max(0.75, 1.5 / currentHasteMult);

    let realCast = spell.baseCastTime > 0 ? (spell.baseCastTime / currentHasteMult) : 0;
    const blockDuration = Math.max(realGcd, realCast); 

    // 3. 上锁
    if (spell.gcdType !== 'off_gcd') {
      state.gcd_until = state.t + realGcd;
      state.channel_until = state.t + blockDuration;
    }
    // 只有非引导技能才立刻进入冷却
    if (spell.baseCooldown > 0 && spell.baseCastTime === 0) {
      let actualCd = spell.cdHasteScaled ? (spell.baseCooldown / currentHasteMult) : spell.baseCooldown;
      state.cooldowns[spell.id] = state.t + actualCd; 
    }

    // 4. 打上 seqId 标记进入渲染列队，供红叉单删使用！
    events.push({ type: 'CAST', spellId: spell.id, startT: state.t, duration: blockDuration, seqId: item.id });
  });
  
  return { finalState: state, events };
}