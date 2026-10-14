import { MetadataRoute } from 'next';
import { getProductionOrigin } from '@/config/site';

/**
 * Generates robots.txt for DataRateKit.
 *
 * Rules:
 * - Public utility tool site: Allow all crawling across all routes.
 * - Does not block query strings (crawler needs to see canonical signals).
 * - Connects sitemap only when a valid production origin is configured.
 */
export default function robots(): MetadataRoute.Robots {
  const origin = getProductionOrigin();

  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: origin ? `${origin}/sitemap.xml` : undefined,
  };
}
