import React, { useEffect } from 'react';
import { describe, it, expect } from 'vitest';
import { act } from 'react';
import { renderElement } from '../setup';
import { useTfhFilters, TFH_STORAGE } from '@/lib/tfh';

function FiltersHarness() {
  const { gender, setGender, minAge, setMinAge, maxAge, setMaxAge, clearFilters } = useTfhFilters();
  useEffect(() => {
    (globalThis as any).__filters = { gender, minAge, maxAge, setGender, setMinAge, setMaxAge, clearFilters };
  }, [gender, minAge, maxAge, setGender, setMinAge, setMaxAge, clearFilters]);
  return null;
}

describe.skip('useTfhFilters', () => {
  it('persists and clears filters via localStorage', async () => {
    localStorage.clear();
    const { unmount } = renderElement(<FiltersHarness />);
    try {
      await new Promise((r) => setTimeout(r, 0));
      const api = (globalThis as any).__filters as ReturnType<typeof useTfhFilters> & any;
      await act(async () => { api.setGender('Mare'); api.setMinAge(5); api.setMaxAge(10); });
      expect(localStorage.getItem(TFH_STORAGE.GENDER)).toBe('Mare');
      expect(localStorage.getItem(TFH_STORAGE.MIN_AGE)).toBe('5');
      expect(localStorage.getItem(TFH_STORAGE.MAX_AGE)).toBe('10');
      await act(async () => { api.clearFilters(); });
      expect(localStorage.getItem(TFH_STORAGE.GENDER)).toBeNull();
      expect(localStorage.getItem(TFH_STORAGE.MIN_AGE)).toBeNull();
      expect(localStorage.getItem(TFH_STORAGE.MAX_AGE)).toBeNull();
    } finally {
      unmount();
    }
  });
});
