import { describe, it, expect } from 'vitest';
import { shouldMatchFor, TFH_STORAGE } from '@/lib/tfh';

describe('tfh matching', () => {
  it('always matches when threshold <= 0', () => {
    expect(shouldMatchFor('Any Name', 0)).toBe(true);
    expect(shouldMatchFor('Any Name', -1)).toBe(true);
  });

  it('never matches when threshold > 1', () => {
    expect(shouldMatchFor('Any Name', 1.01)).toBe(false);
  });

  it('is deterministic for a given name and threshold', () => {
    const a = shouldMatchFor('Deterministic Horse', 0.6);
    const b = shouldMatchFor('Deterministic Horse', 0.6);
    expect(a).toBe(b);
  });

  it('varies across different names with the same threshold (deterministic seed)', () => {
    localStorage.setItem(TFH_STORAGE.SEED, 'test-seed');
    const names = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
    const results = new Set(names.map((n) => shouldMatchFor(n, 0.5)));
    expect(results.size).toBeGreaterThan(1);
  });
});
