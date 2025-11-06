const PROTOCOL_RE = /^[a-z][a-z0-9+\-.]*:\/\//i;

const sanitize = (value: string, defaultScheme = "https"): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (PROTOCOL_RE.test(trimmed)) {
    return trimmed.replace(/\/+$/, "");
  }

  const withoutSlash = trimmed.replace(/^\/+/, "").replace(/\/+$/, "");
  if (!withoutSlash) return null;
  return `${defaultScheme}://${withoutSlash}`;
};

export function resolveBaseUrl(defaultDomain = 'secondhorse.nl'): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`,
    process.env.VERCEL_BRANCH_URL && `https://${process.env.VERCEL_BRANCH_URL}`,
    process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
    `https://${defaultDomain}`,
  ];

  for (const candidate of candidates) {
    const sanitized = sanitize(candidate);
    if (sanitized) {
      return sanitized;
    }
  }

  return sanitize(`https://${defaultDomain}`) ?? `https://${defaultDomain}`;
}
