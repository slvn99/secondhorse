import type { MetadataRoute } from 'next';

function resolveBaseUrl(): string {
  const direct = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (direct) return direct.replace(/\/+$/, '');
  const vercelDomain = process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL;
  if (vercelDomain) {
    const normalized = vercelDomain.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    return `https://${normalized}`;
  }
  return 'https://secondhorse.nl';
}

export default function robots(): MetadataRoute.Robots {
  const base = resolveBaseUrl();
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `${base}/sitemap.xml`,
  };
}
