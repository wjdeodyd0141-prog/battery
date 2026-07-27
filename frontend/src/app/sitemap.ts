import { MetadataRoute } from 'next';
import { api } from '@/lib/api';
import { Product } from '@/lib/types';

const BASE = 'https://powerbankmall.co.kr';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/products`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/inquiries`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
  ];

  try {
    const products = await api.get<Product[]>('/products?limit=1000');
    const productPages: MetadataRoute.Sitemap = products.map((p) => ({
      url: `${BASE}/products/${p.slug}`,
      lastModified: new Date(p.createdAt),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));
    return [...staticPages, ...productPages];
  } catch {
    return staticPages;
  }
}
