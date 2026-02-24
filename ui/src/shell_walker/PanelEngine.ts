import { WW_SKILLS } from './SkillDB';
import type { SkillView } from './types';

export interface CurrentState {
  activeTalents: Record<string, boolean>;
  currentTime: number;
  cooldownReadyTimes: Record<string, number>;
  boKEmpoweredUntil?: number;
  sckEmpoweredUntil?: number;
  rwkReplaceUntil?: number;
}

export function computeLeftPanelViews(state: CurrentState): SkillView[] {
  const views: SkillView[] = [];

  for (const skill of WW_SKILLS) {
    let isVisible = true;

    if (skill.requiredTalent && !state.activeTalents[skill.requiredTalent]) {
      isVisible = false;
    }

    if (skill.id === 'RWK') {
      isVisible = (state.rwkReplaceUntil ?? 0) > state.currentTime;
    }

    if (skill.id === 'RSK' && (state.rwkReplaceUntil ?? 0) > state.currentTime) {
      isVisible = false;
    }

    if (!isVisible) continue;

    const readyTime = state.cooldownReadyTimes[skill.id] || 0;
    let remainsCd = Math.max(0, readyTime - state.currentTime);
    let isReady = remainsCd === 0;
    let lockReason = isReady ? undefined : '冷却中';

    if (skill.id === 'WDP') {
      const rskReady = state.cooldownReadyTimes['RSK'] || 0;
      const fofReady = state.cooldownReadyTimes['FoF'] || 0;
      const isRskOnCd = rskReady > state.currentTime;
      const isFofOnCd = fofReady > state.currentTime;

      if (isReady && (!isRskOnCd || !isFofOnCd)) {
        isReady = false;
        remainsCd = 999;
        lockReason = '需旭日与怒雷均在CD中';
      }
    }

    const isHighlighted =
      (skill.id === 'BoK' && (state.boKEmpoweredUntil ?? 0) > state.currentTime) ||
      (skill.id === 'SCK' && (state.sckEmpoweredUntil ?? 0) > state.currentTime);

    views.push({
      ...skill,
      isVisible,
      isReady,
      remainsCd,
      lockReason,
      isHighlighted
    });
  }

  return views;
}
