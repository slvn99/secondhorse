import React, { useEffect } from 'react';
import { describe, it, expect } from 'vitest';
import { act } from 'react';
import { renderElement } from '../setup';
import { useDeckIndex } from '@/lib/tfh';

function IndexHarness({ max }: { max: number }) {
  const [index, setIndex] = useDeckIndex(max);
  useEffect(() => { (globalThis as any).__idx = { index, setIndex }; }, [index, setIndex]);
  return null;
}

describe.skip('useDeckIndex', () => {
  it('persists and clamps index to max+1', async () => {
    const { unmount } = renderElement(<IndexHarness max={3} />);
    try {
      await new Promise((r) => setTimeout(r, 0));
      const api = (globalThis as any).__idx as { index: number; setIndex: (n: number) => void };
      await act(async () => { api.setIndex(10); });
      // allow effect to run
      await new Promise((r) => setTimeout(r, 0));
      expect((globalThis as any).__idx.index).toBe(4); // max+1
    } finally {
      unmount();
    }
  });
});
