import type { MetadataRoute } from 'next';
import { resolveBaseUrl } from './_lib/baseUrl';

export default function robots(): MetadataRoute.Robots {
  const base = resolveBaseUrl();
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `${base}/sitemap.xml`,
  };
}
