import { MetadataRoute } from 'next';
import { getProductionOrigin, INDEXABLE_ROUTES } from '@/config/site';

/**
 * Generates sitemap.xml for DataRateKit.
 *
 * Rules:
 * - Only includes the 4 verified clean canonical routes.
 * - Does not include query-state URLs, 404, or unindexed pages.
 * - Requires a valid production origin. If unconfigured (e.g. local dev), returns empty list
 *   to avoid emitting localhost or fake domain signals.
 * - Omits speculative changeFrequency, priority, or artificial lastModified timestamps.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getProductionOrigin();
  if (!origin) {
    return [];
  }

  return INDEXABLE_ROUTES.map((route) => ({
    url: route === '/' ? `${origin}/` : `${origin}${route}`,
  }));
}
