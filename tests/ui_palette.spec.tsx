import { describe, it, expect } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { AbilityPalette } from '../src/components/AbilityPalette';
import { wwData } from '../src/jobs/windwalker';
import { TIMELINE_ROW_ORDER } from '../src/constants/timelineRows';

(global as any).ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('AbilityPalette', () => {
  it('renders four horizontal rows', async () => {
    const abilities = wwData(0);
    const div = document.createElement('div');
    document.body.appendChild(div);
    const root = createRoot(div);
    await act(async () => {
      root.render(<AbilityPalette abilities={abilities} onUse={() => {}} />);
    });
    const rows = div.querySelectorAll('.ability-row');
    expect(rows.length).toBe(TIMELINE_ROW_ORDER.length);
    rows.forEach(row => expect(row.classList.contains('ability-row')).toBe(true));
    root.unmount();
  });

  it('shows BLK_HL, SCK, SCK_HL in minorFiller row', async () => {
    const abilities = wwData(0);
    const div = document.createElement('div');
    document.body.appendChild(div);
    const root = createRoot(div);
    await act(async () => {
      root.render(<AbilityPalette abilities={abilities} onUse={() => {}} />);
    });
    const minorRow = div.querySelector('[data-row="minorFiller"]');
    expect(minorRow).toBeTruthy();
    const imgs = minorRow!.querySelectorAll('img');
    const alts = Array.from(imgs).map(i => i.getAttribute('alt'));
    expect(alts).toContain('BLK_HL');
    expect(alts).toContain('SCK');
    expect(alts).toContain('SCK_HL');
    root.unmount();
  });
});
