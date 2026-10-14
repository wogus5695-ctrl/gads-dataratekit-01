/**
 * Site configuration and Technical SEO URL utilities.
 *
 * Centralizes site identity, canonical origin resolution, and URL validation.
 * Ensures that development or unconfigured environments NEVER emit fake production hostnames or localhost canonicals.
 */

export const SITE_NAME = 'DataRateKit';
export const SITE_DESCRIPTION =
  'Precision calculators and unit conversion utilities for data transfers and network speeds.';

/**
 * Validates whether a string is a valid absolute origin (protocol + host, no path, no trailing slash).
 * Examples of valid origins:
 * - https://example.com
 * - http://my-domain.org:3000
 *
 * Examples of invalid origins:
 * - example.com (no protocol)
 * - /path
 * - https://example.com/subpath (has path)
 * - javascript:...
 */
export function validateOrigin(input: string | undefined | null): string | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    // Must be http or https
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    // Must not have path or query/hash
    if (parsed.pathname !== '/' && parsed.pathname !== '') {
      return null;
    }
    if (parsed.search || parsed.hash) {
      return null;
    }
    // Return origin without trailing slash (e.g. "https://domain.com")
    return parsed.origin;
  } catch {
    return null;
  }
}

/**
 * Resolves the configured production origin.
 * Uses process.env.SITE_URL as the single authoritative source of truth.
 *
 * Fail-safe:
 * In Vercel production deployment (process.env.VERCEL_ENV === 'production'),
 * an unconfigured or invalid SITE_URL will throw a descriptive build error to
 * prevent deploying pages with empty canonicals or empty sitemaps.
 */
export function getProductionOrigin(): string | null {
  const envUrl = process.env.SITE_URL;
  const validated = validateOrigin(envUrl);

  if (process.env.VERCEL_ENV === 'production' && !validated) {
    throw new Error(
      '[DataRateKit SEO Fail-Safe] VERCEL_ENV=production detected but SITE_URL is missing or invalid. ' +
        'Expected format: "https://www.dataratekit.com". Please configure SITE_URL in Vercel project environment variables.'
    );
  }

  return validated;
}

/**
 * Returns the absolute canonical URL for a given path if a valid production origin is configured.
 * If no valid production origin is configured (e.g. local dev / unconfigured build), returns undefined.
 * This prevents emitting false canonical or localhost signals.
 *
 * @param path Clean route path starting with '/' (e.g. '/', '/upload-time-calculator')
 */
export function getCanonicalUrl(path: string): string | undefined {
  const origin = getProductionOrigin();
  if (!origin) {
    return undefined;
  }

  // Ensure path starts with '/'
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  // For root '/', return origin or origin + '/' (Next.js URL handles this cleanly)
  return normalizedPath === '/' ? `${origin}/` : `${origin}${normalizedPath}`;
}

/**
 * Returns metadataBase for Root Layout if a valid production origin is configured.
 * Returns null/undefined safely when unconfigured to prevent build crashes.
 */
export function getMetadataBase(): URL | undefined {
  const origin = getProductionOrigin();
  if (!origin) {
    return undefined;
  }
  try {
    return new URL(origin);
  } catch {
    return undefined;
  }
}

/**
 * Clean indexable routes of DataRateKit.
 */
export const INDEXABLE_ROUTES = [
  '/',
  '/upload-time-calculator',
  '/file-transfer-time-calculator',
  '/mbps-to-mbs',
] as const;
