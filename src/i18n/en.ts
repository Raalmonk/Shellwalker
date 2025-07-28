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
  'Boss技能': 'Boss Abilities',
  '祝福': 'Blessing',
  Buffs: 'Buffs',
  '青龙之心': "Yolo's Heart",
  '青龙': 'Yolo',
  'AA青龙': 'AA Yolo',
  'SW青龙': 'SW Yolo',
  'CC青龙': 'CC Yolo',
  'cd没转好': 'CD not ready',
  '引导中不能施放其他技能': 'Cannot cast while channeling',
  '导出SimC APL': 'Export SimC APL',
};

export function t(zh: string): string {
  return zhToEn[zh] ?? zh;
}
