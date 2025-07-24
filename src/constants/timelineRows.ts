export const TIMELINE_ROW_ORDER = [
  'majorCd',
  'minorCd',
  'majorFiller',
  'minorFiller',
] as const;
export type TimelineRow = typeof TIMELINE_ROW_ORDER[number];
