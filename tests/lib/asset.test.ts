import { describe, it, expect } from 'vitest';
import { asset } from '@/lib/asset';

describe('asset()', () => {
  it('passes through absolute URLs', () => {
    const url = 'https://example.com/img.png';
    expect(asset(url)).toBe(url);
  });

  it('appends version query using NEXT_PUBLIC_COMMIT_SHA', () => {
    const prev = process.env.NEXT_PUBLIC_COMMIT_SHA;
    process.env.NEXT_PUBLIC_COMMIT_SHA = 'abc123';
    try {
      const out = asset('/img.png');
      expect(out).toBe('/img.png?v=abc123');
    } finally {
      if (prev === undefined) delete process.env.NEXT_PUBLIC_COMMIT_SHA; else process.env.NEXT_PUBLIC_COMMIT_SHA = prev;
    }
  });

  it('uses & when URL already has query params', () => {
    const prev = process.env.NEXT_PUBLIC_COMMIT_SHA;
    process.env.NEXT_PUBLIC_COMMIT_SHA = 'xyz';
    try {
      const out = asset('/img.png?x=1');
      expect(out).toBe('/img.png?x=1&v=xyz');
    } finally {
      if (prev === undefined) delete process.env.NEXT_PUBLIC_COMMIT_SHA; else process.env.NEXT_PUBLIC_COMMIT_SHA = prev;
    }
  });

  it('falls back to NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA when primary is missing', () => {
    const prev1 = process.env.NEXT_PUBLIC_COMMIT_SHA;
    const prev2 = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA;
    delete process.env.NEXT_PUBLIC_COMMIT_SHA;
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA = 'vercelsha';
    try {
      const out = asset('/img.png');
      expect(out).toBe('/img.png?v=vercelsha');
    } finally {
      if (prev1 === undefined) delete process.env.NEXT_PUBLIC_COMMIT_SHA; else process.env.NEXT_PUBLIC_COMMIT_SHA = prev1;
      if (prev2 === undefined) delete process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA; else process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA = prev2;
    }
  });
});
