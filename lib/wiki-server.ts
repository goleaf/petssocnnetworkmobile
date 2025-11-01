import type { WikiArticle } from "./types"
import { mockWikiArticles } from "./mock-data"

/**
 * Server-side function to get wiki article by type and slug
 * Uses mock data since storage uses localStorage (client-side only)
 */
export function getWikiArticleByTypeAndSlug(
  type: string,
  slug: string,
): WikiArticle | undefined {
  return mockWikiArticles.find(
    (article) => article.category === type && article.slug === slug,
  )
}

/**
 * Get wiki article by slug only (for compatibility)
 */
export function getWikiArticleBySlugServer(slug: string): WikiArticle | undefined {
  return mockWikiArticles.find((article) => article.slug === slug)
}

/**
 * Generate JSON-LD structured data based on article type
 */
export function generateJsonLd(article: WikiArticle, baseUrl: string = "https://pawsocial.com") {
  const url = `${baseUrl}/wiki/${article.category}/${article.slug}`
  const imageUrl = article.coverImage
    ? article.coverImage.startsWith("http")
      ? article.coverImage
      : `${baseUrl}${article.coverImage}`
    : undefined

  // Base structure common to all types
  const base = {
    "@context": "https://schema.org",
    headline: article.title,
    description: article.content.substring(0, 200).replace(/\n/g, " "),
    url,
    datePublished: article.createdAt,
    dateModified: article.updatedAt,
    author: {
      "@type": "Person",
      name: "Pet Care Expert", // Would need to fetch author details
    },
    publisher: {
      "@type": "Organization",
      name: "PawSocial",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/icon-512x512.png`,
      },
    },
    ...(imageUrl && {
      image: {
        "@type": "ImageObject",
        url: imageUrl,
      },
    }),
  }

  // Type-specific schemas
  switch (article.category) {
    case "health":
      return {
        ...base,
        "@type": "MedicalWebPage",
        medicalAudience: {
          "@type": "Patient",
          audienceType: article.species?.join(", ") || "General",
        },
        specialty: "Veterinary Medicine",
      }
    case "breeds":
      return {
        ...base,
        "@type": "Product",
        category: "Pet Breed Information",
        ...(article.species && article.species.length > 0 && {
          brand: {
            "@type": "Brand",
            name: article.species[0],
          },
        }),
      }
    default:
      return {
        ...base,
        "@type": "Article",
        articleSection: article.category,
        ...(article.species && {
          keywords: article.species.join(", "),
        }),
      }
  }
}

