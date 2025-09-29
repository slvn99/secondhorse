const sanitize = (value: string): string => {
  const trimmed = value.trim();
  const withoutProtocol = trimmed.replace(/^[a-z]+:\/\//i, '');
  return `https://${withoutProtocol.replace(/\/+$/, '')}`;
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
    if (candidate && candidate.trim()) {
      return sanitize(candidate);
    }
  }

  return `https://${defaultDomain}`;
}
