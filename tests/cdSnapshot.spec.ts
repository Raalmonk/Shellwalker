import { describe, it, expect } from 'vitest';
import { BuffManager, Bloodlust } from '../src/combat/azureDragonHeart';
import { FoF } from '../src/combat/skills';

// FoF base CD is 24s. With gear haste 20% and BL 30% => total 1.56 multiplier

describe('cooldown snapshot', () => {
  it('FoF under bloodlust uses haste at cast time', () => {
    const mgr = new BuffManager(13200); // 20% gear
    mgr.add(new Bloodlust(0));
    const { cd } = FoF.use(0, mgr);
    expect(cd * 1000).toBeCloseTo(24000 / 1.56, 1);
  });
});
