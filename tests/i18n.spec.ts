import { describe, it, expect } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import App from '../src/App';

describe('i18n', () => {
  it('renders without Chinese characters', async () => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    const root = createRoot(div);
    await act(async () => {
      root.render(<App />);
    });
    const hasChinese = /[\u4e00-\u9fff]/.test(document.body.innerText);
    root.unmount();
    expect(hasChinese).toBe(false);
  });
});
