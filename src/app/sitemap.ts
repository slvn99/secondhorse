import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { MetadataRoute } from 'next';

export const runtime = 'nodejs';
export const dynamic = 'force-static';
export const revalidate = 3600; // refresh once per hour in prod

type RouteInfo = {
  path: string;
  lastModified?: Date;
};

const appDirectory = path.join(process.cwd(), 'src', 'app');

async function collectStaticRoutes(dir: string, segments: string[] = []): Promise<RouteInfo[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const routes: RouteInfo[] = [];

  const pageFile = entries.find((entry) => entry.isFile() && /^page\.(tsx|ts|jsx|js|mdx)$/.test(entry.name));
  if (pageFile) {
    const pagePath = path.join(dir, pageFile.name);
    const stats = await fs.stat(pagePath);
    const routePath = segments.length ? `/${segments.join('/')}` : '/';
    routes.push({ path: routePath, lastModified: stats.mtime });
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const name = entry.name;
    if (name === 'api' || name.startsWith('_') || name.startsWith('@')) continue;
    if (name.startsWith('[')) continue;

    const nextDir = path.join(dir, name);
    const nextSegments = name.startsWith('(') && name.endsWith(')') ? segments : [...segments, name];
    routes.push(...await collectStaticRoutes(nextDir, nextSegments));
  }

  return routes;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');
  const staticRoutes = await collectStaticRoutes(appDirectory);

  const routeMap = new Map<string, RouteInfo>();
  for (const route of staticRoutes) {
    const existing = routeMap.get(route.path);
    if (!existing || (route.lastModified && (!existing.lastModified || route.lastModified > existing.lastModified))) {
      routeMap.set(route.path, route);
    }
  }

  const sortedRoutes = Array.from(routeMap.values()).sort((a, b) => {
    if (a.path === '/' && b.path !== '/') return -1;
    if (b.path === '/' && a.path !== '/') return 1;
    return a.path.localeCompare(b.path);
  });

  return sortedRoutes.map((route) => {
    const isHome = route.path === '/';
    const url = isHome ? `${baseUrl}/` : `${baseUrl}${route.path}`;
    return {
      url,
      lastModified: route.lastModified,
      changeFrequency: isHome ? 'weekly' : 'monthly',
      priority: isHome ? 1.0 : 0.6,
    } satisfies MetadataRoute.Sitemap[number];
  });
}
