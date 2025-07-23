import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AbilityBlock } from '../src/features/timeline/AbilityBlock';

describe('AbilityBlock', () => {
  it('left aligned icon', () => {
    const out = renderToStaticMarkup(
      <svg>
        <AbilityBlock icon="test.png" startPx={50} />
      </svg>
    );
    expect(out).toContain('x="50"');
  });
});
