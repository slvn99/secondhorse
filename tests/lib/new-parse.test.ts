import { describe, it, expect } from 'vitest';
import { normalizeAndParse } from '@/app/new/validation';

describe('new profile validation', () => {
  it('accepts minimal input with only display_name', () => {
    const out = normalizeAndParse({ display_name: 'Shadowfax', age_years: '', height_cm: '' });
    expect(out.display_name).toBe('Shadowfax');
    expect(out.age_years ?? null).toBeNull();
    expect(out.height_cm ?? null).toBeNull();
  });

  it('rejects too-small height when provided', () => {
    expect(() => normalizeAndParse({ display_name: 'Comet', height_cm: '40' })).toThrow();
  });

  it('accepts gender enum when provided and lowercased', () => {
    const out = normalizeAndParse({ display_name: 'Bella', gender: 'mare' });
    expect(out.gender).toBe('mare');
  });
});

