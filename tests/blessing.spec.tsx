import { describe, it, expect } from 'vitest';
import { BuffManager, hasteMult } from '../src/combat/azureDragonHeart';
import { CC, SW } from '../src/combat/skills';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BlessingRow, selectBlessingStacks } from '../src/features/timeline/BlessingRow';

function use(skill:any, t:number, mgr:BuffManager) {
  skill.use(t, mgr);
}

describe('Blessing stacks', () => {
  it('stack interaction and haste', () => {
    const mgr = new BuffManager();
    // cast CC at 0s (starts at 4s)
    use(CC, 0, mgr);
    mgr.advance(5);
    expect(mgr.activeBlessings(5).length).toBe(1);

    // cast SW while CC active
    use(SW, 5, mgr); // SW buff starts at 5.4s
    mgr.advance(6);
    expect(mgr.activeBlessings(6).length).toBe(2);

    // advance to CC expiration (10s)
    mgr.advance(10);
    const stacksAt10 = mgr.activeBlessings(10);
    expect(stacksAt10.length).toBe(2);
    const sw = stacksAt10.find(b => b.source === 'SW');
    expect(sw && Math.abs(sw.end - 17.4) < 0.001).toBe(true);
    expect(hasteMult(mgr, 10)).toBeCloseTo(Math.pow(1.15, 2), 2);
  });

  it('overlay text shows stack count', () => {
    const segs = [
      { startMs: 0, endMs: 4000 },
      { startMs: 0, endMs: 4000 },
      { startMs: 0, endMs: 4000 },
    ];
    const segments = segs.map(s => ({
      ...s,
      startPx: 0,
      widthPx: 30,
      stacks: selectBlessingStacks(segs, s.startMs),
    }));
    const svg = renderToStaticMarkup(
      <svg>
        <BlessingRow segments={segments} rowMidY={5} />
      </svg>,
    );
    expect(svg.includes('3×')).toBe(true);
  });
});
