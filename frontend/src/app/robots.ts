import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/checkout/', '/my/', '/cart'],
    },
    sitemap: 'https://powerbankmall.co.kr/sitemap.xml',
  };
}
