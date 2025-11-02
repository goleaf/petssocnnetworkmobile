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
  const url = `${baseUrl}/wiki/${article.slug}`
  const imageUrl = article.coverImage
    ? article.coverImage.startsWith("http")
      ? article.coverImage
      : `${baseUrl}${article.coverImage}`
    : undefined

  // Helper to get plain text description from markdown
  const getPlainDescription = (content: string): string => {
    // Remove markdown headers, links, bold, italic, etc.
    return content
      .replace(/#{1,6}\s+/g, '') // Remove headers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Replace links with text
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
      .replace(/\*([^*]+)\*/g, '$1') // Remove italic
      .replace(/`([^`]+)`/g, '$1') // Remove code
      .replace(/\n/g, ' ') // Replace newlines with space
      .trim()
      .substring(0, 200)
  }

  // Base structure common to all types
  const base = {
    "@context": "https://schema.org",
    headline: article.title,
    description: getPlainDescription(article.content),
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

  // Helper to detect if article is about a place/location
  const isPlaceArticle = (article: WikiArticle): boolean => {
    const placeKeywords = ['park', 'trail', 'beach', 'location', 'place', 'facility', 'venue', 'dog park', 'pet-friendly']
    const searchText = `${article.title} ${article.content} ${article.subcategory || ''} ${(article.tags || []).join(' ')}`.toLowerCase()
    return placeKeywords.some(keyword => searchText.includes(keyword))
  }

  // Type-specific schemas
  switch (article.category) {
    case "health":
      // Enhanced MedicalWebPage schema
      const healthSchema: any = {
        ...base,
        "@type": "MedicalWebPage",
        medicalAudience: {
          "@type": "Patient",
          audienceType: article.species?.join(", ") || "General",
        },
        specialty: "Veterinary Medicine",
      }

      // Add health-specific data if available
      if (article.healthData) {
        const healthData = article.healthData
        
        // Add mainEntity property with Condition schema
        healthSchema.mainEntity = {
          "@type": "MedicalCondition",
          name: article.title,
          ...(healthData.symptoms && healthData.symptoms.length > 0 && {
            signOrSymptom: healthData.symptoms.map((symptom: string) => ({
              "@type": "MedicalSignOrSymptom",
              name: symptom,
            })),
          }),
          ...(healthData.diagnosisMethods && healthData.diagnosisMethods.length > 0 && {
            diagnosis: healthData.diagnosisMethods.map((method: string) => ({
              "@type": "MedicalProcedure",
              name: method,
              procedureType: "DiagnosticProcedure",
            })),
          }),
        }

        // Add treatment information
        if (healthData.treatments && healthData.treatments.length > 0) {
          healthSchema.mainEntity.treatment = healthData.treatments.map((treatment: string) => ({
            "@type": "MedicalTreatment",
            name: treatment,
          }))
        }

        // Add last reviewed date if available
        if (healthData.lastReviewedDate || article.approvedAt) {
          healthSchema.dateModified = healthData.lastReviewedDate || article.approvedAt
          healthSchema.lastReviewed = healthData.lastReviewedDate || article.approvedAt
        }
      }

      return healthSchema

    case "breeds":
      // Enhanced Product schema for breed information
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
        additionalProperty: [
          {
            "@type": "PropertyValue",
            name: "Category",
            value: article.subcategory || article.category,
          },
          ...(article.tags && article.tags.length > 0 ? [{
            "@type": "PropertyValue",
            name: "Tags",
            value: article.tags.join(", "),
          }] : []),
        ],
      }

    default:
      // Check if this is a place-related article
      if (isPlaceArticle(article)) {
        // Place schema for location-based articles
        return {
          ...base,
          "@type": "Place",
          name: article.title,
          description: getPlainDescription(article.content),
          ...(imageUrl && {
            photo: {
              "@type": "ImageObject",
              url: imageUrl,
            },
          }),
          // Add place-specific properties if available
          ...(article.tags && article.tags.length > 0 && {
            amenityFeature: article.tags
              .filter(tag => ['fenced', 'water', 'parking', 'restroom', 'shade', 'benches'].includes(tag.toLowerCase()))
              .map(tag => ({
                "@type": "LocationFeatureSpecification",
                name: tag,
                value: true,
              })),
          }),
        }
      }

      // Enhanced Article schema for regular articles
      return {
        ...base,
        "@type": "Article",
        articleSection: article.subcategory || article.category,
        ...(article.species && article.species.length > 0 && {
          keywords: [
            ...article.species,
            ...(article.tags || []),
            article.category,
            ...(article.subcategory ? [article.subcategory] : []),
          ].join(", "),
        }),
        ...(!article.species && article.tags && article.tags.length > 0 && {
          keywords: [
            ...article.tags,
            article.category,
            ...(article.subcategory ? [article.subcategory] : []),
          ].join(", "),
        }),
        inLanguage: article.baseLanguage || "en",
      }
  }
}

/**
 * Get all wiki articles for sitemap generation
 */
export function getAllWikiArticlesForSitemap() {
  return mockWikiArticles.map((article) => ({
    slug: article.slug,
    category: article.category,
    updatedAt: article.updatedAt,
  }))
}

