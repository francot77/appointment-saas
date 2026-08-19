import type { MetadataRoute } from 'next';
import { getSeoBaseUrl } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSeoBaseUrl();

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard',
        '/billing',
        '/login',
        '/register',
        '/api',
        '/r',
        '/dev',
        '/_next',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
