const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 5; // per window per key

type Entry = { ts: number }[];
const buckets = new Map<string, Entry>();

function prune(list: Entry, now: number, windowMs: number) {
  while (list.length && now - list[0].ts > windowMs) list.shift();
}

export function rateLimit(key: string, max = MAX_REQUESTS, windowMs = WINDOW_MS): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const list = buckets.get(key) || [];
  prune(list, now, windowMs);
  if (list.length >= max) {
    buckets.set(key, list);
    return { allowed: false, remaining: 0 };
  }
  list.push({ ts: now });
  buckets.set(key, list);
  return { allowed: true, remaining: Math.max(0, max - list.length) };
}
