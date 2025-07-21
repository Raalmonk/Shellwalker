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
  stacks = 1;
  constructor(start: number) {
    super('Blessing', start, BUFF_DURATION.Blessing);
  }

  addStack() {
    this.stacks += 1;
    this.duration += BUFF_DURATION.Blessing;
  }

  get hasteMult() {
    return Math.pow(BLESSING_HASTE, this.stacks);
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
      const active = this.buffs.find(
        b => b instanceof Blessing && b.isActive(buff.start),
      ) as Blessing | undefined;
      if (active) {
        active.addStack();
        return active;
      }
      this.buffs.push(buff);
      return buff;
    }

    if (buff instanceof AzureDragonHeart) {
      if (buff.kind === 'CC') {
        for (const b of this.buffs) {
          if (
            b instanceof AzureDragonHeart &&
            b.kind === 'AA' &&
            b.isActive(buff.start)
          ) {
            b.duration = buff.start - b.start;
            b.check(buff.start);
          }
        }
      }
      buff.on('expire', () => {
        const blessing = this.buffs.find(
          b => b instanceof Blessing && b.isActive(buff.end),
        ) as Blessing | undefined;
        if (blessing) blessing.extend(BUFF_DURATION.Blessing);
      });
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

  blessing(time = this.time) {
    return this.activeBuffs(time).find(
      b => b instanceof Blessing,
    ) as Blessing | undefined;
  }
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
  const blessing = manager.blessing(time);
  return blessing ? blessing.hasteMult : 1;
}
