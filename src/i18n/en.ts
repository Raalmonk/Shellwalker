export const zhToEn: Record<string, string> = {
  '踏风排轴器': 'Windwalker Timeline Planner',
  'Boss时间轴选项': 'Boss Timeline Options',
  '切换': 'Switch',
  '浅色': 'Light',
  '深色': 'Dark',
  '查看时间范围': 'View Range',
  '时间': 'Time',
  '隐藏CD': 'Hide CD',
  '显示CD': 'Show CD',
  '释放时间': 'Cast Time',
  '转好时间': 'Ready At',
  'Boss时间轴': 'Boss Timeline',
  '阶段': 'Phases',
  '祝福': 'Blessing',
  Buffs: 'Buffs',
  '青龙之心': "Yolo's Heart",
  '青龙': 'Yolo',
  'AA青龙': 'AA Yolo',
  'SW青龙': 'SW Yolo',
  'CC青龙': 'CC Yolo',
  'cd没转好': 'CD not ready',
  '引导中不能施放其他技能': 'Cannot cast while channeling',
  '释放时间已自动调整至可用时间': 'Cast time has been auto-adjusted to the next available time',
  '导出SimC APL': 'Export SimC APL',
  '已切换为简化视图模式，仅显示主技能。':
    'Switched to compact view mode, only main skills are shown.',
};

export function t(zh: string): string {
  return zhToEn[zh] ?? zh;
}
