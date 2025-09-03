import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the 'tone' module
const start = vi.fn().mockResolvedValue(undefined);
vi.mock('tone', () => ({ default: { start }, start }));

import { ensureAudioOnce, waitForUserGesture } from '@/lib/audioGate';

describe('audioGate', () => {
  beforeEach(() => {
    start.mockClear();
  });

  it('ensureAudioOnce calls Tone.start only once across multiple calls', async () => {
    await ensureAudioOnce();
    await ensureAudioOnce();
    expect(start).toHaveBeenCalledTimes(1);
  });

  it('waitForUserGesture resolves after a gesture', async () => {
    const p = waitForUserGesture();
    // Dispatch a pointerdown to simulate a gesture
    window.dispatchEvent(new Event('pointerdown'));
    await p;
  });

  // Note: when Tone.start() rejects, ensureAudioOnce swallows the error for idempotency.
});
