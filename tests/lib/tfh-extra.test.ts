import { describe, it, expect } from 'vitest';
import { scoreForName, stableIdForName } from '@/lib/tfh';

describe('tfh extras', () => {
  it('stableIdForName returns consistent hash for same name', () => {
    const a = stableIdForName('Shadowfax');
    const b = stableIdForName('Shadowfax');
    expect(a).toBe(b);
    expect(typeof a).toBe('string');
    expect(a.length).toBeGreaterThan(0);
  });

  it('scoreForName produces value in [0,1) and changes with seed', () => {
    const s1 = scoreForName('Comet', 'seedA');
    const s2 = scoreForName('Comet', 'seedB');
    expect(s1).toBeGreaterThanOrEqual(0);
    expect(s1).toBeLessThan(1);
    expect(s2).toBeGreaterThanOrEqual(0);
    expect(s2).toBeLessThan(1);
    expect(s1).not.toBe(s2);
  });
});

