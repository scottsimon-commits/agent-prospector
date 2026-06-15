import { MetadataRoute } from 'next'

const BASE = 'https://agent-prospector.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/prospect`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/build`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/gallery`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/registry`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
  ]
}
