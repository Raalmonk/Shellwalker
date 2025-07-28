import { describe, it, expect } from 'vitest';
import { exportSimcApl } from '../src/utils/simcApl';
import { wwData } from '../src/jobs/windwalker';

(describe)("exportSimcApl", () => {
  it('converts timeline to APL with waits', () => {
    const abilities = wwData(0);
    const items = [
      { ability: 'TP', start: 0, id: 1, group: 1, label: '' },
      { ability: 'RSK', start: 1.2, id: 2, group: 1, label: '' },
      { ability: 'FoF', start: 1.9, id: 3, group: 1, label: '' },
    ];
    const apl = exportSimcApl(items, abilities);
    expect(apl).toBe(
`actions+=/tiger_palm
actions+=/wait,sec=1.2
actions+=/rising_sun_kick
actions+=/wait,sec=0.7
actions+=/fists_of_fury`);
  });
});
