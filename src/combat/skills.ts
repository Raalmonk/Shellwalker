import { BuffManager, AzureDragonHeart, Blessing, cdSpeedAt, fofModAt, hasteMult } from './azureDragonHeart';
import { BUFF_DURATION } from '../constants/buffs';

export interface SkillOptions {
  name: string;
  baseCd: number;
  cast?: number;
  hasted?: boolean;
}

export class Skill {
  constructor(public opts: SkillOptions) {}

  use(time: number, manager: BuffManager) {
    const cdSpd = cdSpeedAt(manager, time);
    const haste = hasteMult(manager, time);
    const base = this.opts.baseCd;
    const cd = this.opts.hasted ? base / (cdSpd * haste) : base / cdSpd;
    let cast = this.opts.cast ?? 0;
    if (this.opts.name === 'FoF') {
      cast *= fofModAt(manager, time);
    }
    // apply buffs
    if (this.opts.name === 'AA') {
      manager.add(new AzureDragonHeart('AA', time));
    } else if (this.opts.name === 'SW') {
      manager.add(new AzureDragonHeart('SW', time + cast));
    } else if (this.opts.name === 'CC') {
      const start = time + cast;
      manager.add(new AzureDragonHeart('CC', start));
      manager.add(new Blessing(start));
    }
    manager.advance(time); // ensure expiration check upto now
    return { cd, cast };
  }
}

export const AA = new Skill({ name: 'AA', baseCd: 30 });
export const SW = new Skill({ name: 'SW', baseCd: 30, cast: 0.4 });
export const CC = new Skill({ name: 'CC', baseCd: 90, cast: 4 });
export const FoF = new Skill({ name: 'FoF', baseCd: 24, cast: 4, hasted: true });
export const RSK = new Skill({ name: 'RSK', baseCd: 10, hasted: true });
export const WU = new Skill({ name: 'WU', baseCd: 25, hasted: true });
