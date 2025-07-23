import { Buff } from './buff';
import {
  BUFF_DURATION,
  BLESSING_HASTE,
  CD_SPEED,
  FOF_SPEED,
  DragonType,
} from '../constants/buffs';

export class Blessing extends Buff {
  constructor(
    public source: DragonType | 'POST',
    start: number,
    duration = BUFF_DURATION.Blessing,
  ) {
    super('BLG', start, duration);
  }
}

export class AzureDragonHeart extends Buff {
  constructor(public kind: DragonType, start: number) {
    super(`${kind}_BD`, start, BUFF_DURATION[kind]);
  }
}

export class BuffManager {
  private buffs: Buff[] = [];
  time = 0;

  advance(to: number) {
    this.time = to;
    for (const b of this.buffs) {
      b.check(to);
    }
    this.buffs = this.buffs.filter(b => !b.expired);
  }

  add(buff: Buff) {
    if (buff instanceof Blessing) {
      this.buffs.push(buff);
      return buff;
    }

    if (buff instanceof AzureDragonHeart) {
      if (buff.kind === 'CC' || buff.kind === 'AA') {
        for (const b of this.buffs) {
          if (
            b instanceof AzureDragonHeart &&
            (b.kind === 'AA' || b.kind === 'CC') &&
            b.kind !== buff.kind &&
            b.isActive(buff.start)
          ) {
            // end the previous window immediately
            b.duration = buff.start - b.start;
            // shorten its blessing as well
            const bl = this.buffs.find(
              bb =>
                bb instanceof Blessing &&
                bb.source === b.kind &&
                bb.isActive(buff.start),
            ) as Blessing | undefined;
            if (bl) {
              bl.duration = buff.start - bl.start;
              bl.check(buff.start);
            }
            b.check(buff.start);
          }
        }
      }
      const blg = new Blessing(buff.kind, buff.start, BUFF_DURATION[buff.kind]);
      this.buffs.push(blg);
      buff.on('expire', () => {
        this.addPostBlessing(buff.end);
      });
      this.buffs.push(buff);
      return buff;
    }

    this.buffs.push(buff);
    return buff;
  }

  private addPostBlessing(time: number) {
    const active = this.buffs.find(
      b => b instanceof Blessing && b.isActive(time),
    ) as Blessing | undefined;
    if (active) {
      active.duration += BUFF_DURATION.Blessing;
    } else {
      this.buffs.push(new Blessing('POST', time));
    }
  }

  activeBuffs(time = this.time) {
    return this.buffs.filter(b => b.isActive(time));
  }

  activeDragons(time = this.time) {
    return this.activeBuffs(time).filter(
      b => b instanceof AzureDragonHeart,
    ) as AzureDragonHeart[];
  }

  activeBlessings(time = this.time) {
    return this.activeBuffs(time).filter(
      b => b instanceof Blessing,
    ) as Blessing[];
  }

  blessingHaste(time = this.time) {
    const n = this.activeBlessings(time).length;
    return Math.pow(BLESSING_HASTE, n);
  }
}

export function cdSpeedAt(manager: BuffManager, time = manager.time) {
  const list = manager.activeDragons(time).map(b => b.kind);
  const hasAA = list.includes('AA');
  const hasSW = list.includes('SW');
  const hasCC = list.includes('CC');
  let extra = 0;
  if (hasCC) extra += CD_SPEED.CC;
  else if (hasAA) extra += CD_SPEED.AA;
  if (hasSW) extra += CD_SPEED.SW;
  if (hasSW && (hasAA || hasCC)) extra *= CD_SPEED.SW_COEXIST;
  return 1 + extra;
}

export function fofModAt(manager: BuffManager, time = manager.time) {
  const list = manager.activeDragons(time).map(b => b.kind);
  const hasAA = list.includes('AA');
  const hasSW = list.includes('SW');
  const hasCC = list.includes('CC');
  if (hasSW && (hasAA || hasCC)) return FOF_SPEED.SW_WITH_OTHERS;
  if (hasAA || hasSW || hasCC) return FOF_SPEED.DRAGON;
  return FOF_SPEED.BASE;
}

export function hasteMult(manager: BuffManager, time = manager.time) {
  return manager.blessingHaste(time);
}
