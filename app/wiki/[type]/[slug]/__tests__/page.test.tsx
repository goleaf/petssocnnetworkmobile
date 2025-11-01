import { generateMetadata } from "../page"
import { getWikiArticleByTypeAndSlug, generateJsonLd } from "@/lib/wiki-server"

// Mock the wiki-server module
jest.mock("@/lib/wiki-server", () => ({
  getWikiArticleByTypeAndSlug: jest.fn(),
  generateJsonLd: jest.fn((article: any, baseUrl: string) => ({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    url: `${baseUrl}/wiki/${article.category}/${article.slug}`,
  })),
}))

// Mock next/navigation
jest.mock("next/navigation", () => ({
  notFound: jest.fn(),
}))

// Mock environment variables
process.env.NEXT_PUBLIC_SITE_URL = "https://pawsocial.com"

describe("Wiki Article Page - Metadata", () => {
  const mockArticle = {
    id: "1",
    title: "Test Article Title",
    slug: "test-article",
    category: "health" as const,
    subcategory: "preventive-care",
    species: ["dog", "cat"],
    content: "This is a test article content that should be used for description generation. It needs to be long enough to test the substring functionality.",
    coverImage: "/test-image.png",
    authorId: "1",
    views: 100,
    likes: [],
    createdAt: "2024-01-01",
    updatedAt: "2024-01-02",
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset environment variable
    process.env.NEXT_PUBLIC_SITE_URL = "https://pawsocial.com"
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("should generate correct metadata for a wiki article", async () => {
    const mockGetWikiArticle = getWikiArticleByTypeAndSlug as jest.MockedFunction<
      typeof getWikiArticleByTypeAndSlug
    >
    mockGetWikiArticle.mockReturnValue(mockArticle)

    const metadata = await generateMetadata({
      params: Promise.resolve({ type: "health", slug: "test-article" }),
    })

    expect(metadata.title).toBe("Test Article Title")
    expect(metadata.description).toContain("This is a test article content")
    expect(metadata.openGraph?.title).toBe("Test Article Title")
    expect(metadata.openGraph?.url).toBe(
      "https://pawsocial.com/wiki/health/test-article",
    )
    expect(metadata.openGraph?.type).toBe("article")
    expect(metadata.openGraph?.siteName).toBe("PawSocial")
  })

  it("should include OpenGraph image when coverImage is provided", async () => {
    const mockGetWikiArticle = getWikiArticleByTypeAndSlug as jest.MockedFunction<
      typeof getWikiArticleByTypeAndSlug
    >
    mockGetWikiArticle.mockReturnValue(mockArticle)

    const metadata = await generateMetadata({
      params: Promise.resolve({ type: "health", slug: "test-article" }),
    })

    expect(metadata.openGraph?.images).toBeDefined()
    expect(metadata.openGraph?.images?.[0]).toEqual({
      url: "https://pawsocial.com/test-image.png",
      width: 1200,
      height: 630,
      alt: "Test Article Title",
    })
  })

  it("should use default image when coverImage is not provided", async () => {
    const articleWithoutImage = {
      ...mockArticle,
      coverImage: undefined,
    }
    const mockGetWikiArticle = getWikiArticleByTypeAndSlug as jest.MockedFunction<
      typeof getWikiArticleByTypeAndSlug
    >
    mockGetWikiArticle.mockReturnValue(articleWithoutImage)

    const metadata = await generateMetadata({
      params: Promise.resolve({ type: "health", slug: "test-article" }),
    })

    expect(metadata.openGraph?.images).toBeDefined()
    expect(metadata.openGraph?.images?.[0].url).toContain("icon-512x512.png")
  })

  it("should include Twitter card metadata", async () => {
    const mockGetWikiArticle = getWikiArticleByTypeAndSlug as jest.MockedFunction<
      typeof getWikiArticleByTypeAndSlug
    >
    mockGetWikiArticle.mockReturnValue(mockArticle)

    const metadata = await generateMetadata({
      params: Promise.resolve({ type: "health", slug: "test-article" }),
    })

    expect(metadata.twitter).toBeDefined()
    expect(metadata.twitter?.card).toBe("summary_large_image")
    expect(metadata.twitter?.title).toBe("Test Article Title")
    expect(metadata.twitter?.images).toBeDefined()
  })

  it("should include keywords in metadata", async () => {
    const mockGetWikiArticle = getWikiArticleByTypeAndSlug as jest.MockedFunction<
      typeof getWikiArticleByTypeAndSlug
    >
    mockGetWikiArticle.mockReturnValue(mockArticle)

    const metadata = await generateMetadata({
      params: Promise.resolve({ type: "health", slug: "test-article" }),
    })

    expect(metadata.keywords).toBeDefined()
    expect(metadata.keywords).toContain("health")
    expect(metadata.keywords).toContain("dog")
    expect(metadata.keywords).toContain("cat")
    expect(metadata.keywords).toContain("preventive-care")
  })

  it("should return not found metadata when article doesn't exist", async () => {
    const mockGetWikiArticle = getWikiArticleByTypeAndSlug as jest.MockedFunction<
      typeof getWikiArticleByTypeAndSlug
    >
    mockGetWikiArticle.mockReturnValue(undefined)

    const metadata = await generateMetadata({
      params: Promise.resolve({ type: "health", slug: "non-existent" }),
    })

    expect(metadata.title).toBe("Article Not Found")
  })

  it("should handle full URL cover images correctly", async () => {
    const articleWithFullUrl = {
      ...mockArticle,
      coverImage: "https://example.com/image.png",
    }
    const mockGetWikiArticle = getWikiArticleByTypeAndSlug as jest.MockedFunction<
      typeof getWikiArticleByTypeAndSlug
    >
    mockGetWikiArticle.mockReturnValue(articleWithFullUrl)

    const metadata = await generateMetadata({
      params: Promise.resolve({ type: "health", slug: "test-article" }),
    })

    expect(metadata.openGraph?.images?.[0].url).toBe("https://example.com/image.png")
  })

  it("should truncate description to reasonable length", async () => {
    const longContentArticle = {
      ...mockArticle,
      content: "A".repeat(500),
    }
    const mockGetWikiArticle = getWikiArticleByTypeAndSlug as jest.MockedFunction<
      typeof getWikiArticleByTypeAndSlug
    >
    mockGetWikiArticle.mockReturnValue(longContentArticle)

    const metadata = await generateMetadata({
      params: Promise.resolve({ type: "health", slug: "test-article" }),
    })

    expect(metadata.description?.length).toBeLessThanOrEqual(160)
  })
})

describe("Wiki Article Page - OpenGraph", () => {
  const mockArticle = {
    id: "1",
    title: "Complete Guide to Dog Nutrition",
    slug: "dog-nutrition-guide",
    category: "nutrition" as const,
    species: ["dog"],
    content: "Proper nutrition is essential for your dog's health and wellbeing.",
    coverImage: "/dog-food-nutrition.png",
    authorId: "1",
    views: 1250,
    likes: [],
    createdAt: "2024-11-15",
    updatedAt: "2024-12-01",
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should generate OpenGraph metadata with all required fields", async () => {
    const mockGetWikiArticle = getWikiArticleByTypeAndSlug as jest.MockedFunction<
      typeof getWikiArticleByTypeAndSlug
    >
    mockGetWikiArticle.mockReturnValue(mockArticle)

    const metadata = await generateMetadata({
      params: Promise.resolve({ type: "nutrition", slug: "dog-nutrition-guide" }),
    })

    const og = metadata.openGraph
    expect(og).toBeDefined()
    expect(og?.title).toBe("Complete Guide to Dog Nutrition")
    expect(og?.description).toBeDefined()
    expect(og?.url).toBe("https://pawsocial.com/wiki/nutrition/dog-nutrition-guide")
    expect(og?.siteName).toBe("PawSocial")
    expect(og?.type).toBe("article")
    expect(og?.locale).toBe("en_US")
    expect(og?.images).toBeDefined()
    expect(og?.images?.length).toBeGreaterThan(0)
  })

  it("should include proper OpenGraph image dimensions", async () => {
    const mockGetWikiArticle = getWikiArticleByTypeAndSlug as jest.MockedFunction<
      typeof getWikiArticleByTypeAndSlug
    >
    mockGetWikiArticle.mockReturnValue(mockArticle)

    const metadata = await generateMetadata({
      params: Promise.resolve({ type: "nutrition", slug: "dog-nutrition-guide" }),
    })

    const image = metadata.openGraph?.images?.[0]
    expect(image).toBeDefined()
    expect(image?.width).toBe(1200)
    expect(image?.height).toBe(630)
    expect(image?.alt).toBe("Complete Guide to Dog Nutrition")
  })

  it("should generate OpenGraph for different article types", async () => {
    const healthArticle = {
      ...mockArticle,
      category: "health" as const,
      slug: "health-article",
    }
    const mockGetWikiArticle = getWikiArticleByTypeAndSlug as jest.MockedFunction<
      typeof getWikiArticleByTypeAndSlug
    >
    mockGetWikiArticle.mockReturnValue(healthArticle)

    const metadata = await generateMetadata({
      params: Promise.resolve({ type: "health", slug: "health-article" }),
    })

    expect(metadata.openGraph?.url).toContain("/wiki/health/health-article")
    expect(metadata.openGraph?.type).toBe("article")
  })
})

