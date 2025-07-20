export const DRAGON_TYPES = ['AA', 'SW', 'CC'] as const;
export type DragonType = typeof DRAGON_TYPES[number];

export const BUFF_DURATION: Record<DragonType | 'Blessing', number> = {
  AA: 6,
  SW: 8,
  CC: 6,
  Blessing: 4,
};

export const CD_SPEED = {
  AA: 0.75,
  SW: 0.75,
  CC: 1.5,
  SW_COEXIST: 1.75,
};

export const FOF_SPEED = {
  BASE: 1,
  DRAGON: 0.5,
  SW_WITH_OTHERS: 0.25,
};

export const BLESSING_HASTE = 1.15;
