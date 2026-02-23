import { StateSnapshot, Action, EngineEvent } from './EngineTypes';
import { WW_SKILLS } from './SkillDB';

const MAX_CHI = 6;
const MAX_ENERGY = 120;
const BASE_ENERGY_REGEN = 10; // 踏风每秒基础回能 10 点

export function applyAction(
  prevState: StateSnapshot, 
  action: Action
): { newState: StateSnapshot; events: EngineEvent[] } {
  
  // 🌟 0. 深拷贝生成平行宇宙 (保证纯函数，绝不污染旧快照)
  const state: StateSnapshot = JSON.parse(JSON.stringify(prevState));
  const events: EngineEvent[] = [];
  
  const spell = WW_SKILLS.find(s => s.id === action.spellId);
  if (!spell) {
    events.push({ type: 'ERROR', startT: state.t, duration: 0, chiDiff: 0, energyDiff: 0, message: `未知技能: ${action.spellId}` });
    return { newState: state, events };
  }

  const currentHasteMult = 1 + state.haste;
  const energyRegenRate = BASE_ENERGY_REGEN * currentHasteMult;

  // ==========================================
  // ⏳ 阶段一：时间跳跃与发呆结算 (Wait Block Logic)
  // 引擎寻找该技能最早能按下去的“绝对时间戳”
  // ==========================================
  
  // 阻力 A：公共冷却 (GCD) 和 引导 (Channel)
  let readyTime = state.t;
  if (spell.gcdType !== 'off_gcd') {
    readyTime = Math.max(readyTime, state.gcd_until, state.channel_until);
  }
  
  // 阻力 B：技能自己的 CD 转好没？(反向压迫感)
  const cdReadyAt = state.cooldowns[spell.id] || 0;
  readyTime = Math.max(readyTime, cdReadyAt);

  // 阻力 C：能量够不够？不够的话，算算还需要发呆几秒才能回够！
  // 假设等到 readyTime，能量有多少？
  let energyAtReadyTime = Math.min(MAX_ENERGY, state.energy + (readyTime - state.t) * energyRegenRate);
  if ((spell.energyCost || 0) > energyAtReadyTime) {
    const energyNeeded = (spell.energyCost || 0) - energyAtReadyTime;
    const timeToWaitEnergy = energyNeeded / energyRegenRate;
    readyTime += timeToWaitEnergy; // 强行把按键时间往未来推移！
  }

  // 💥 结算发呆留白！如果准备时间大于当前时间，说明玩家被迫发呆了！
  const waitDuration = readyTime - state.t;
  if (waitDuration > 0.001) {
    const energyGained = waitDuration * energyRegenRate;
    state.energy = Math.min(MAX_ENERGY, state.energy + energyGained);
    
    // 蓄水池：平砍产生疾风层数 (假设0急速下每秒0.35层)
    state.flurryCharges += waitDuration * 0.35 * currentHasteMult;
    
    events.push({
      type: 'WAIT',
      startT: state.t,
      duration: waitDuration,
      chiDiff: 0,
      energyDiff: energyGained,
      message: `等待资源或CD ${waitDuration.toFixed(2)}s`
    });
    
    state.t = readyTime; // 游标瞬间快进到能够施法的时刻
  }

  // ==========================================
  // 🚨 阶段二：硬性防呆拦截
  // ==========================================
  const chiCost = spell.chiCost || 0;
  const chiGen = spell.chiGen || 0;
  const energyCost = spell.energyCost || 0;

  if (state.chi < chiCost) {
    events.push({ type: 'ERROR', startT: state.t, duration: 0, chiDiff: 0, energyDiff: 0, message: '❌ 真气不足' });
    return { newState: state, events };
  }

  if (state.lastSpellCast === spell.id) {
    events.push({ type: 'ERROR', startT: state.t, duration: 0, chiDiff: 0, energyDiff: 0, message: '⚠️ 连击中断，精通失效！' });
  }

  // ==========================================
  // 💥 阶段三：正式施法扣费与时间锁更新
  // ==========================================
  state.energy -= energyCost;
  state.chi = Math.min(MAX_CHI, state.chi - chiCost + chiGen);
  state.lastSpellCast = spell.id;

  // 算物理耗时 (你草稿里的多态 GCD 法则)
  let realGcd = 0;
  if (spell.gcdType === 'locked_1s') realGcd = 1.0;
  else if (spell.gcdType === 'fixed_0.4s') realGcd = 0.4;
  else if (spell.gcdType === 'haste_scaled') realGcd = Math.max(0.75, 1.5 / currentHasteMult);

  let realCast = spell.isChanneled ? (spell.baseCooldown /* MVP先暂借用作引导时间 */ / currentHasteMult) : 0;
  const blockDuration = Math.max(realGcd, realCast); // 积木总宽度

  // 上锁未来时间轴
  if (spell.gcdType !== 'off_gcd') {
    state.gcd_until = state.t + realGcd;
    state.channel_until = state.t + blockDuration;
  }

  // 更新技能 CD 账本
  if (spell.baseCooldown > 0 && !spell.isChanneled) {
    let actualCd = spell.cdHasteScaled ? (spell.baseCooldown / currentHasteMult) : spell.baseCooldown;
    state.cooldowns[spell.id] = state.t + actualCd; // 🌟 存的是绝对时间戳
  }

  if (spell.id === 'FoF') {
    // 怒雷破清空疾风蓄水池
    state.flurryCharges = 0;
  }

  // 抛出彩色渲染积木
  events.push({
    type: 'CAST',
    spellId: spell.id,
    startT: state.t,
    duration: blockDuration,
    chiDiff: chiGen - chiCost,
    energyDiff: -energyCost
  });

  return { newState: state, events };
}