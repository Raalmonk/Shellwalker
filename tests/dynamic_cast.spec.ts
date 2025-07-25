import { describe, it, expect } from 'vitest';
import { calcDynamicEndTime } from '../src/utils/calcDynamicEndTime';

const BL = { key: 'BL', start: 1, end: 41, multiplier: 1.3 };

describe('calcDynamicEndTime', () => {
  it('FoF shortened by Bloodlust mid-cast', () => {
    const end = calcDynamicEndTime(0, 4, [BL], [], 0, ['AA_BD','SW_BD','CC_BD']);
    // 1s normal speed then haste 1.3x for remaining 3s => 1 + 3/1.3
    expect(end).toBeCloseTo(1 + 3 / 1.3, 3);
  });

  it('dragon speed applies', () => {
    const sw = { key: 'SW_BD', start: 0, end: 8 };
    const end = calcDynamicEndTime(0, 4, [sw], [], 0, ['AA_BD','SW_BD','CC_BD']);
    expect(end).toBeCloseTo(2, 3);
  });
});
