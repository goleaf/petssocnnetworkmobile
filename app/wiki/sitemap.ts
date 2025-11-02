import { MetadataRoute } from 'next'
import { getAllWikiArticlesForSitemap } from '@/lib/wiki-server'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pawsocial.com'
  
  // Get all wiki articles
  const articles = getAllWikiArticlesForSitemap()

  // Generate sitemap entries for each article
  // Use /wiki/[category]/[slug] format to match actual routes
  const articleEntries = articles.map((article) => ({
    url: `${baseUrl}/wiki/${article.category}/${article.slug}`,
    lastModified: article.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: article.category === 'health' ? 0.9 : 0.8,
  }))

  // Add main wiki page
  const wikiMainEntry = {
    url: `${baseUrl}/wiki`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily' as const,
    priority: 1.0,
  }

  return [wikiMainEntry, ...articleEntries]
}

