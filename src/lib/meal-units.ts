export const DAILY_LOG_UNITS = [
  'gram',
  'adet',
  'kase',
  'bardak',
  'tabak',
  'porsiyon',
  'çay kaşığı',
  'tatlı kaşığı',
  'çorba kaşığı',
  'yemek kaşığı',
] as const;

export type DailyMealUnit = (typeof DAILY_LOG_UNITS)[number];
