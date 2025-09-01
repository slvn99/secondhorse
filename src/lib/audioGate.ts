// Simple, shared audio unlock utility to satisfy autoplay policies.
// Ensures Tone.start() is only invoked once after a user gesture.

let audioInitPromise: Promise<void> | null = null;

export function ensureAudioOnce(): Promise<void> {
  if (!audioInitPromise) {
    audioInitPromise = import("tone")
      .then(async (Tone) => {
        try {
          await Tone.start();
        } catch {
          // swallow – caller can retry by re-gesturing; keep promise for idempotency
        }
      })
      .catch((e) => {
        // reset so a later attempt can retry
        audioInitPromise = null;
        throw e;
      });
  }
  return audioInitPromise;
}

export function waitForUserGesture(): Promise<void> {
  return new Promise((resolve) => {
    const unlock = async () => {
      try {
        await ensureAudioOnce();
      } finally {
        window.removeEventListener("pointerdown", unlock);
        window.removeEventListener("keydown", unlock);
        resolve();
      }
    };
    window.addEventListener("pointerdown", unlock, { once: false });
    window.addEventListener("keydown", unlock, { once: false });
  });
}

