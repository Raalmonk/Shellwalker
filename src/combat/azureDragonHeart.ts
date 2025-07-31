import { Buff } from './buff';
import {
  BUFF_DURATION,
  BLESSING_HASTE,
  DRAGON_TYPES,
  CD_SPEED,
  FOF_SPEED,
  DragonType,
} from '../constants/buffs';

export class Blessing extends Buff {
  constructor(
    public source: DragonType | 'POST',
    start: number,
    duration: number = BUFF_DURATION.Blessing,
  ) {
    super('Blessing', start, duration);
  }
}

export class AzureDragonHeart extends Buff {
  blessing: Blessing;
  constructor(public kind: DragonType, start: number) {
    super(`${kind}_BD`, start, BUFF_DURATION[kind]);
    this.blessing = new Blessing(kind, start, BUFF_DURATION[kind]);
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
      const active = this.activeBlessings(buff.start);
      if (active.some(b => b.source === buff.source)) return buff;
      this.buffs.push(buff);
      return buff;
    }

    if (buff instanceof AzureDragonHeart) {
      if (buff.kind === 'CC') {
        for (const b of this.buffs) {
          if (
            b instanceof AzureDragonHeart &&
            b.kind === 'AA' &&
            (b.isActive(buff.start) || b.end === buff.start)
          ) {
            b.duration = buff.start - b.start;
            b.blessing.duration = b.duration;
            b.check(buff.start);
            b.blessing.check(buff.start);
            buff.blessing.source = 'AA';
          }
        }
      } else if (buff.kind === 'AA') {
        for (const b of this.buffs) {
          if (
            b instanceof AzureDragonHeart &&
            b.kind === 'CC' &&
            (b.isActive(buff.start) || b.end === buff.start)
          ) {
            b.duration = buff.start - b.start;
            b.blessing.duration = b.duration;
            b.check(buff.start);
            b.blessing.check(buff.start);
            buff.blessing.source = 'CC';
          }
        }
      }
      buff.on('expire', () => {
        this.addPostBlessing(buff.end, buff.kind);
      });
      this.add(buff.blessing);
      this.buffs.push(buff);
      return buff;
    }

    this.buffs.push(buff);
    return buff;
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

  blessing(time = this.time) {
    return this.activeBlessings(time)[0];
  }

  private addPostBlessing(time: number, ended: DragonType) {
    const stillActive = this.activeDragons(time).some(d => d.kind !== ended);
    if (stillActive) return;
    const post = this.activeBlessings(time).find(b => b.source === 'POST');
    if (post) {
      post.extend(BUFF_DURATION.Blessing);
    } else {
      this.buffs.push(new Blessing('POST', time));
    }
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
  const stacks = manager.activeBlessings(time).length;
  return Math.pow(BLESSING_HASTE, stacks);
}
