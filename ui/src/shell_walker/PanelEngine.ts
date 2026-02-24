import { WW_SKILLS } from './SkillDB';
import type { SkillView } from './types';

// 这是你从全局 Store (Zustand/Pinia) 传进来的当前状态
export interface CurrentState {
  activeTalents: Record<string, boolean>;     // 玩家目前勾选了哪些天赋
  currentTime: number;                        // 当前排轴游标卡在第几秒？(例如 15.5秒)
  cooldownReadyTimes: Record<string, number>; // 各个技能【真正转好的绝对时间戳】
}

/**
 * 🌟 核心引擎：根据当前状态，计算左侧面板该怎么渲染！
 */
export function computeLeftPanelViews(state: CurrentState): SkillView[] {
  const views: SkillView[] = [];

  for (const skill of WW_SKILLS) {
    // ----------------------------------------
    // 👁️ 1. 天赋显隐过滤 (MVP)
    // ----------------------------------------
    let isVisible = true;
    if (skill.requiredTalent && !state.activeTalents[skill.requiredTalent]) {
      isVisible = false; // 没点天赋，直接隐身！
    }

    if (!isVisible) continue; // 不可见的技能连算 CD 的资格都没有，直接跳过

    // ----------------------------------------
    // ⏳ 2. 基础 CD 灰显判定
    // ----------------------------------------
    const readyTime = state.cooldownReadyTimes[skill.id] || 0;
    let remainsCd = Math.max(0, readyTime - state.currentTime);
    let isReady = remainsCd === 0;
    let lockReason = isReady ? undefined : '冷却中';

    // ----------------------------------------
    // 🔒 3. 升龙霸 (WDP) 的终极防呆特判
    // ----------------------------------------
    if (skill.id === 'WDP') {
      const rskReady = state.cooldownReadyTimes['RSK'] || 0;
      const fofReady = state.cooldownReadyTimes['FoF'] || 0;
      
      const isRskOnCd = rskReady > state.currentTime;
      const isFofOnCd = fofReady > state.currentTime;

      // 只有在 WDP 自己没 CD，且 RSK 和 FoF 【都在 CD 中】时，升龙霸才能亮起！
      if (isReady && (!isRskOnCd || !isFofOnCd)) {
        isReady = false;
        remainsCd = 999; // 强行给一个假 CD，让 UI 保持灰显
        lockReason = '需旭日与怒雷均在CD中';
      }
    }

    // 打包推给前端框架渲染
    views.push({
      ...skill,
      isVisible,
      isReady,
      remainsCd,
      lockReason
    });
  }

  return views;
}