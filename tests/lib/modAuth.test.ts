import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import { signSession, verifySession } from '@/lib/modAuth';

const SECRET = 's3cr3t';

describe('modAuth session signing/verification', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    process.env.MODERATION_SESSION_SECRET = SECRET;
  });

  it('round-trips a valid session cookie', () => {
    const cookie = signSession('alice');
    const user = verifySession(cookie);
    expect(user).toBe('alice');
  });

  it('rejects tampered signature', () => {
    const cookie = signSession('bob');
    const bad = cookie.replace(/sig=[a-f0-9]+/, 'sig=deadbeef');
    expect(verifySession(bad)).toBeNull();
  });

  it('rejects expired sessions', () => {
    // Build a cookie older than 8 hours (MAX_AGE_MS)
    const nineHoursMs = 9 * 60 * 60 * 1000;
    const oldTs = String(Date.now() - nineHoursMs);
    const base = `bob|${oldTs}`;
    const sig = crypto.createHmac('sha256', SECRET).update(base).digest('hex');
    const cookie = `u=${encodeURIComponent('bob')};ts=${oldTs};sig=${sig}`;
    expect(verifySession(cookie)).toBeNull();
  });
});

