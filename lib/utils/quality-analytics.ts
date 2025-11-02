import type { WikiArticle, HealthArticleData } from "@/lib/types"
import { getAllItems } from "@/lib/storage"

export interface QualityIssue {
  id: string
  type: "stub" | "stale_health" | "orphaned"
  articleId: string
  articleSlug: string
  articleTitle: string
  severity: "low" | "medium" | "high"
  description: string
  detectedAt: string
  lastUpdated?: string
}

export interface QualityDashboardData {
  totalArticles: number
  stubs: number
  staleHealthPages: number
  orphanedPages: number
  issuesBySeverity: {
    low: number
    medium: number
    high: number
  }
  issues: QualityIssue[]
  totalIssues: number
  healthScore: number // 0-100
}

// Detect stub articles (short content, minimal information)
export function detectStubs(articles: WikiArticle[]): QualityIssue[] {
  const issues: QualityIssue[] = []
  const STUB_CONTENT_LENGTH_THRESHOLD = 200 // characters
  const STUB_SECTIONS_THRESHOLD = 2 // sections

  articles.forEach((article) => {
    if (article.content.length < STUB_CONTENT_LENGTH_THRESHOLD) {
      const sections = article.content.split(/\n#{1,3}\s+/).length
      if (sections < STUB_SECTIONS_THRESHOLD) {
        issues.push({
          id: `stub-${article.id}`,
          type: "stub",
          articleId: article.id,
          articleSlug: article.slug,
          articleTitle: article.title,
          severity: article.content.length < 100 ? "high" : "medium",
          description: `Article is too short (${article.content.length} chars, ${sections} sections)`,
          detectedAt: new Date().toISOString(),
          lastUpdated: article.updatedAt,
        })
      }
    }
  })

  return issues
}

// Detect stale health pages (outdated health information)
export function detectStaleHealthPages(articles: WikiArticle[]): QualityIssue[] {
  const issues: QualityIssue[] = []
  const STALE_MONTHS_THRESHOLD = 12 // months

  const healthArticles = articles.filter((article) => article.category === "health")

  healthArticles.forEach((article) => {
    const lastUpdated = new Date(article.updatedAt)
    const now = new Date()
    const monthsSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24 * 30)

    if (monthsSinceUpdate > STALE_MONTHS_THRESHOLD) {
      // Check if it's a health article with health-specific data
      const hasHealthData = article.tags?.some((tag) =>
        tag.match(/health|symptom|treatment|diagnos|urgent|medical/i)
      )

      if (hasHealthData) {
        let severity: "low" | "medium" | "high" = "medium"
        if (monthsSinceUpdate > 24) severity = "high"
        else if (monthsSinceUpdate > 18) severity = "high"
        else if (monthsSinceUpdate < 15) severity = "low"

        issues.push({
          id: `stale-${article.id}`,
          type: "stale_health",
          articleId: article.id,
          articleSlug: article.slug,
          articleTitle: article.title,
          severity,
          description: `Last updated ${Math.floor(monthsSinceUpdate)} months ago (health content should be reviewed every 12 months)`,
          detectedAt: new Date().toISOString(),
          lastUpdated: article.updatedAt,
        })
      }
    }
  })

  return issues
}

// Detect orphaned pages (no inbound links from other wiki articles)
export function detectOrphanedPages(articles: WikiArticle[]): QualityIssue[] {
  const issues: QualityIssue[] = []
  const MIN_LINK_COUNT = 1 // minimum links from other articles

  // Build a map of which articles are linked to
  const inboundLinkCounts = new Map<string, number>()

  articles.forEach((article) => {
    // Count links in content and related articles
    let linkCount = 0

    // Count links from related articles
    if (article.relatedArticles && article.relatedArticles.length > 0) {
      linkCount += article.relatedArticles.length
    }

    // Count wiki links in content (looking for [[link]] patterns)
    const wikiLinkMatches = article.content.match(/\[\[([^\]]+)\]\]/g)
    if (wikiLinkMatches) {
      linkCount += wikiLinkMatches.length
    }

    // Count mentions in tags
    const tagMatches = article.tags?.filter((tag) => {
      // Check if tag matches another article's slug or title
      return articles.some(
        (other) => other.id !== article.id && (other.slug === tag || other.title.toLowerCase() === tag.toLowerCase())
      )
    }).length || 0

    linkCount += tagMatches

    inboundLinkCounts.set(article.id, linkCount)
  })

  // Find articles with insufficient inbound links
  articles.forEach((article) => {
    const linkCount = inboundLinkCounts.get(article.id) || 0

    if (linkCount < MIN_LINK_COUNT) {
      issues.push({
        id: `orphaned-${article.id}`,
        type: "orphaned",
        articleId: article.id,
        articleSlug: article.slug,
        articleTitle: article.title,
        severity: linkCount === 0 ? "medium" : "low",
        description: `Only ${linkCount} inbound link${linkCount !== 1 ? "s" : ""} from other wiki articles`,
        detectedAt: new Date().toISOString(),
        lastUpdated: article.updatedAt,
      })
    }
  })

  return issues
}

// Get all quality issues for the wiki
export function getQualityIssues(): QualityIssue[] {
  const articles = getAllItems<WikiArticle>("wiki_articles")
  
  const stubs = detectStubs(articles)
  const staleHealthPages = detectStaleHealthPages(articles)
  const orphanedPages = detectOrphanedPages(articles)

  return [...stubs, ...staleHealthPages, ...orphanedPages]
}

// Get quality dashboard data
export function getQualityDashboardData(): QualityDashboardData {
  const articles = getAllItems<WikiArticle>("wiki_articles")
  const issues = getQualityIssues()

  const totalArticles = articles.length
  const stubs = issues.filter((issue) => issue.type === "stub").length
  const staleHealthPages = issues.filter((issue) => issue.type === "stale_health").length
  const orphanedPages = issues.filter((issue) => issue.type === "orphaned").length

  const issuesBySeverity = {
    low: issues.filter((issue) => issue.severity === "low").length,
    medium: issues.filter((issue) => issue.severity === "medium").length,
    high: issues.filter((issue) => issue.severity === "high").length,
  }

  const totalIssues = issues.length

  // Calculate health score (0-100)
  // Perfect score: no issues
  // Penalties: low = -1, medium = -3, high = -5
  const baseScore = 100
  const penalty = issuesBySeverity.low * 1 + issuesBySeverity.medium * 3 + issuesBySeverity.high * 5
  const healthScore = Math.max(0, baseScore - penalty)

  return {
    totalArticles,
    stubs,
    staleHealthPages,
    orphanedPages,
    issuesBySeverity,
    issues,
    totalIssues,
    healthScore,
  }
}

// Get issues by type
export function getIssuesByType(type: "stub" | "stale_health" | "orphaned"): QualityIssue[] {
  return getQualityIssues().filter((issue) => issue.type === type)
}

// Get issues by severity
export function getIssuesBySeverity(severity: "low" | "medium" | "high"): QualityIssue[] {
  return getQualityIssues().filter((issue) => issue.severity === severity)
}

