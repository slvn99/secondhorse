import type { MetadataRoute } from 'next';
import { resolveBaseUrl } from './_lib/baseUrl';

export default function robots(): MetadataRoute.Robots {
  const origin = resolveBaseUrl();
  const parsed = new URL(origin);
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    host: parsed.host,
    sitemap: `${parsed.origin}/sitemap.xml`,
  };
}
