export function asset(path: string): string {
  if (!path) return path;
  // Do not version absolute URLs
  if (/^https?:\/\//i.test(path)) return path;
  const v =
    process.env.NEXT_PUBLIC_COMMIT_SHA ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
    "0";
  const joiner = path.includes("?") ? "&" : "?";
  return `${path}${joiner}v=${encodeURIComponent(v)}`;
}

