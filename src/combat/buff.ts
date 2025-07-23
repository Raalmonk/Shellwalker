import { EventEmitter } from 'events';

export class Buff extends EventEmitter {
  expired = false;
  constructor(
    public name: string,
    public start: number,
    public duration: number,
    /** multiplicative haste bonus (1 = no haste) */
    public hasteMult = 1,
  ) {
    super();
  }

  get end() {
    return this.start + this.duration;
  }

  isActive(time: number) {
    return time >= this.start && time < this.end;
  }

  extend(sec: number) {
    this.duration += sec;
  }

  check(time: number) {
    if (!this.expired && time >= this.end) {
      this.expired = true;
      this.emit('expire', this);
    }
  }
}
