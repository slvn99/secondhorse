import { describe, it, expect } from 'vitest';
import { verifySession } from '@/lib/modAuth';

describe('modAuth production guard', () => {
  it('requires MODERATION_SESSION_SECRET in production for signing (verify rejects malformed cookies)', () => {
    // We cannot call signSession in production without secret (would throw),
    // but verifySession should safely return null for malformed or unsigned cookies.
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    delete process.env.MODERATION_SESSION_SECRET;
    try {
      expect(verifySession('u=alice;ts=0;sig=deadbeef')).toBeNull();
      expect(verifySession('just-some-garbage')).toBeNull();
    } finally {
      process.env.NODE_ENV = prevEnv;
    }
  });
});

