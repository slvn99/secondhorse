import { describe, it, expect } from 'vitest';
import { manifest } from '@/lib/aiManifest';

describe('aiManifest', () => {
  it('exposes groups with arrays of entries', () => {
    const keys = Object.keys(manifest);
    expect(keys.length).toBeGreaterThan(0);
    for (const k of keys) {
      const arr = (manifest as any)[k];
      expect(Array.isArray(arr)).toBe(true);
      if (arr.length) {
        const e = arr[0];
        expect(typeof e.label).toBe('string');
        expect(typeof e.href).toBe('string');
        expect(typeof e.slug).toBe('string');
      }
    }
  });
});

