import { generateJsonLd, getAllWikiArticlesForSitemap } from '@/lib/wiki-server'
import type { WikiArticle, HealthArticleData } from '@/lib/types'

describe('wiki-server', () => {
  const baseUrl = 'https://pawsocial.com'

  describe('generateJsonLd', () => {
    it('should generate Article JSON-LD for default category', () => {
      const article: WikiArticle = {
        id: '1',
        title: 'Test Article',
        slug: 'test-article',
        category: 'care',
        content: '# Test Article\n\nThis is a test article about pet care.',
        authorId: '1',
        views: 100,
        likes: [],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02',
      }

      const jsonLd = generateJsonLd(article, baseUrl)

      expect(jsonLd['@context']).toBe('https://schema.org')
      expect(jsonLd['@type']).toBe('Article')
      expect(jsonLd.headline).toBe('Test Article')
      expect(jsonLd.url).toBe('https://pawsocial.com/wiki/test-article')
      expect(jsonLd.datePublished).toBe('2024-01-01')
      expect(jsonLd.dateModified).toBe('2024-01-02')
      expect(jsonLd.articleSection).toBe('care')
    })

    it('should generate MedicalWebPage JSON-LD for health category', () => {
      const article: WikiArticle = {
        id: '2',
        title: 'Dog Health Guide',
        slug: 'dog-health',
        category: 'health',
        species: ['dog'],
        content: '# Dog Health Guide\n\nImportant health information for dogs.',
        authorId: '1',
        views: 500,
        likes: [],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02',
      }

      const jsonLd = generateJsonLd(article, baseUrl)

      expect(jsonLd['@type']).toBe('MedicalWebPage')
      expect(jsonLd.medicalAudience).toEqual({
        '@type': 'Patient',
        audienceType: 'dog',
      })
      expect(jsonLd.specialty).toBe('Veterinary Medicine')
    })

    it('should include health-specific data when available', () => {
      const healthData: HealthArticleData = {
        symptoms: ['Lethargy', 'Loss of appetite', 'Fever'],
        urgency: 'urgent',
        riskFactors: ['Age', 'Vaccination status'],
        diagnosisMethods: ['Physical examination', 'Blood test'],
        treatments: ['Antibiotics', 'Supportive care'],
        prevention: ['Vaccination', 'Regular checkups'],
      }

      const article: WikiArticle = {
        id: '3',
        title: 'Canine Illness',
        slug: 'canine-illness',
        category: 'health',
        species: ['dog'],
        content: 'Health information',
        authorId: '1',
        views: 100,
        likes: [],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02',
        healthData,
      }

      const jsonLd = generateJsonLd(article, baseUrl)

      expect(jsonLd['@type']).toBe('MedicalWebPage')
      expect(jsonLd.mainEntity).toBeDefined()
      expect(jsonLd.mainEntity['@type']).toBe('MedicalCondition')
      expect(jsonLd.mainEntity.signOrSymptom).toHaveLength(3)
      expect(jsonLd.mainEntity.signOrSymptom[0]).toEqual({
        '@type': 'MedicalSignOrSymptom',
        name: 'Lethargy',
      })
      expect(jsonLd.mainEntity.treatment).toHaveLength(2)
    })

    it('should generate Product JSON-LD for breeds category', () => {
      const article: WikiArticle = {
        id: '4',
        title: 'Golden Retriever',
        slug: 'golden-retriever',
        category: 'breeds',
        species: ['dog'],
        tags: ['friendly', 'family dog'],
        content: 'Breed information',
        authorId: '1',
        views: 200,
        likes: [],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02',
      }

      const jsonLd = generateJsonLd(article, baseUrl)

      expect(jsonLd['@type']).toBe('Product')
      expect(jsonLd.category).toBe('Pet Breed Information')
      expect(jsonLd.brand).toEqual({
        '@type': 'Brand',
        name: 'dog',
      })
      expect(jsonLd.additionalProperty).toBeDefined()
      expect(jsonLd.additionalProperty.length).toBeGreaterThan(0)
    })

    it('should include image when coverImage is provided', () => {
      const article: WikiArticle = {
        id: '5',
        title: 'Test Article',
        slug: 'test',
        category: 'care',
        content: 'Content',
        coverImage: '/test-image.png',
        authorId: '1',
        views: 100,
        likes: [],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02',
      }

      const jsonLd = generateJsonLd(article, baseUrl)

      expect(jsonLd.image).toBeDefined()
      expect(jsonLd.image['@type']).toBe('ImageObject')
      expect(jsonLd.image.url).toBe('https://pawsocial.com/test-image.png')
    })

    it('should handle full URL images', () => {
      const article: WikiArticle = {
        id: '6',
        title: 'Test Article',
        slug: 'test',
        category: 'care',
        content: 'Content',
        coverImage: 'https://example.com/image.png',
        authorId: '1',
        views: 100,
        likes: [],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02',
      }

      const jsonLd = generateJsonLd(article, baseUrl)

      expect(jsonLd.image.url).toBe('https://example.com/image.png')
    })

    it('should include keywords for articles with species', () => {
      const article: WikiArticle = {
        id: '7',
        title: 'Cat Care',
        slug: 'cat-care',
        category: 'care',
        species: ['cat'],
        tags: ['grooming', 'nutrition'],
        content: 'Cat care information',
        authorId: '1',
        views: 100,
        likes: [],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02',
      }

      const jsonLd = generateJsonLd(article, baseUrl)

      expect(jsonLd.keywords).toContain('cat')
      expect(jsonLd.keywords).toContain('grooming')
      expect(jsonLd.keywords).toContain('nutrition')
    })

    it('should remove markdown from description', () => {
      const article: WikiArticle = {
        id: '8',
        title: 'Test',
        slug: 'test',
        category: 'care',
        content: '# Heading\n\nThis is **bold** text with [link](https://example.com)',
        authorId: '1',
        views: 100,
        likes: [],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02',
      }

      const jsonLd = generateJsonLd(article, baseUrl)

      expect(jsonLd.description).toContain('This is bold text with link')
      expect(jsonLd.description).not.toContain('#')
      expect(jsonLd.description).not.toContain('**')
      expect(jsonLd.description).not.toContain('[')
    })

    it('should include subcategory in Article schema', () => {
      const article: WikiArticle = {
        id: '9',
        title: 'Test',
        slug: 'test',
        category: 'care',
        subcategory: 'grooming',
        content: 'Content',
        authorId: '1',
        views: 100,
        likes: [],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02',
      }

      const jsonLd = generateJsonLd(article, baseUrl)

      expect(jsonLd.articleSection).toBe('grooming')
    })

    it('should include lastReviewed date for health articles', () => {
      const article: WikiArticle = {
        id: '10',
        title: 'Health Article',
        slug: 'health',
        category: 'health',
        content: 'Content',
        authorId: '1',
        views: 100,
        likes: [],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02',
        approvedAt: '2024-01-15',
        healthData: {
          symptoms: [],
          urgency: 'routine',
          riskFactors: [],
          diagnosisMethods: [],
          treatments: [],
          prevention: [],
          lastReviewedDate: '2024-01-15',
        },
      }

      const jsonLd = generateJsonLd(article, baseUrl)

      expect(jsonLd.dateModified).toBe('2024-01-15')
      expect(jsonLd.lastReviewed).toBe('2024-01-15')
    })

    it('should generate Place JSON-LD for place-related articles', () => {
      const article: WikiArticle = {
        id: '11',
        title: 'Best Dog Parks in the City',
        slug: 'dog-parks',
        category: 'care',
        subcategory: 'exercise',
        tags: ['fenced', 'water', 'parking'],
        content: 'This article covers the best dog parks and pet-friendly locations in the city.',
        authorId: '1',
        views: 200,
        likes: [],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02',
      }

      const jsonLd = generateJsonLd(article, baseUrl)

      expect(jsonLd['@type']).toBe('Place')
      expect(jsonLd.name).toBe('Best Dog Parks in the City')
      expect(jsonLd.amenityFeature).toBeDefined()
      expect(jsonLd.amenityFeature.length).toBeGreaterThan(0)
    })

    it('should not generate Place schema for non-place articles', () => {
      const article: WikiArticle = {
        id: '12',
        title: 'Cat Nutrition Guide',
        slug: 'cat-nutrition',
        category: 'nutrition',
        content: 'Nutrition information for cats.',
        authorId: '1',
        views: 150,
        likes: [],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02',
      }

      const jsonLd = generateJsonLd(article, baseUrl)

      expect(jsonLd['@type']).toBe('Article')
      expect(jsonLd['@type']).not.toBe('Place')
    })
  })

  describe('getAllWikiArticlesForSitemap', () => {
    it('should return all articles for sitemap', () => {
      const articles = getAllWikiArticlesForSitemap()

      expect(Array.isArray(articles)).toBe(true)
      expect(articles.length).toBeGreaterThan(0)
      
      // Check structure of returned articles
      const firstArticle = articles[0]
      expect(firstArticle).toHaveProperty('slug')
      expect(firstArticle).toHaveProperty('category')
      expect(firstArticle).toHaveProperty('updatedAt')
    })

    it('should return articles with proper structure', () => {
      const articles = getAllWikiArticlesForSitemap()

      articles.forEach((article) => {
        expect(typeof article.slug).toBe('string')
        expect(typeof article.category).toBe('string')
        expect(typeof article.updatedAt).toBe('string')
      })
    })
  })
})

