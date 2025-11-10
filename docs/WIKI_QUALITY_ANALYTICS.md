# Wiki Quality Analytics

## Overview

The Wiki Quality Analytics system provides automated monitoring and reporting of content quality issues across all wiki articles. It helps maintain high-quality, up-to-date, and well-connected content by identifying stubs, stale health information, and orphaned pages.

## Features

### Automated Issue Detection

The system automatically scans all wiki articles and identifies three types of quality issues:

1. **Stub Articles** - Articles with insufficient content
2. **Stale Health Pages** - Health articles with outdated information
3. **Orphaned Pages** - Articles with no inbound links from other articles

### Quality Scoring

A wiki health score (0-100) provides an at-a-glance view of overall content quality, with penalties applied based on issue severity.

## Installation

The quality analytics module is located at `lib/utils/quality-analytics.ts` and requires:

```typescript
import { 
  getQualityDashboardData,
  getQualityIssues,
  getIssuesByType,
  getIssuesBySeverity,
  detectStubs,
  detectStaleHealthPages,
  detectOrphanedPages
} from "@/lib/utils/quality-analytics"
```

## Usage Examples

### Get Complete Quality Dashboard

```typescript
import { getQualityDashboardData } from "@/lib/utils/quality-analytics"

const dashboard = getQualityDashboardData()

console.log(`Total Articles: ${dashboard.totalArticles}`)
console.log(`Health Score: ${dashboard.healthScore}/100`)
console.log(`Total Issues: ${dashboard.totalIssues}`)
console.log(`Stubs: ${dashboard.stubs}`)
console.log(`Stale Health Pages: ${dashboard.staleHealthPages}`)
console.log(`Orphaned Pages: ${dashboard.orphanedPages}`)
console.log(`High Severity: ${dashboard.issuesBySeverity.high}`)
```

### Get All Quality Issues

```typescript
import { getQualityIssues } from "@/lib/utils/quality-analytics"

const issues = getQualityIssues()

issues.forEach(issue => {
  console.log(`[${issue.severity.toUpperCase()}] ${issue.articleTitle}`)
  console.log(`  Type: ${issue.type}`)
  console.log(`  Description: ${issue.description}`)
  console.log(`  Article: /wiki/${issue.articleSlug}`)
})
```

### Filter Issues by Type

```typescript
import { getIssuesByType } from "@/lib/utils/quality-analytics"

// Get only stub articles
const stubs = getIssuesByType("stub")
console.log(`Found ${stubs.length} stub articles`)

// Get only stale health pages
const staleHealth = getIssuesByType("stale_health")
console.log(`Found ${staleHealth.length} stale health articles`)

// Get only orphaned pages
const orphaned = getIssuesByType("orphaned")
console.log(`Found ${orphaned.length} orphaned articles`)
```

### Filter Issues by Severity

```typescript
import { getIssuesBySeverity } from "@/lib/utils/quality-analytics"

// Get high priority issues
const highPriority = getIssuesBySeverity("high")
console.log(`High priority issues requiring immediate attention: ${highPriority.length}`)

// Get medium priority issues
const mediumPriority = getIssuesBySeverity("medium")

// Get low priority issues
const lowPriority = getIssuesBySeverity("low")
```

### Detect Specific Issue Types

```typescript
import { getWikiArticles } from "@/lib/storage"
import { 
  detectStubs, 
  detectStaleHealthPages, 
  detectOrphanedPages 
} from "@/lib/utils/quality-analytics"

const articles = getWikiArticles()

// Detect stub articles
const stubIssues = detectStubs(articles)
stubIssues.forEach(issue => {
  console.log(`Stub: ${issue.articleTitle} (${issue.description})`)
})

// Detect stale health pages
const staleIssues = detectStaleHealthPages(articles)
staleIssues.forEach(issue => {
  console.log(`Stale: ${issue.articleTitle} (${issue.description})`)
})

// Detect orphaned pages
const orphanedIssues = detectOrphanedPages(articles)
orphanedIssues.forEach(issue => {
  console.log(`Orphaned: ${issue.articleTitle} (${issue.description})`)
})
```

## Issue Types

### Stub Articles

**Detection Criteria:**
- Content length < 200 characters
- Number of sections < 2 (sections defined by markdown headers `#`, `##`, `###`)

**Severity Levels:**
- **High**: Content < 100 characters
- **Medium**: Content 100-200 characters

**Example Issue:**
```typescript
{
  id: "stub-article-123",
  type: "stub",
  articleId: "article-123",
  articleSlug: "basic-dog-care",
  articleTitle: "Basic Dog Care",
  severity: "high",
  description: "Article is too short (87 chars, 1 sections)",
  detectedAt: "2025-11-10T12:00:00.000Z",
  lastUpdated: "2024-06-15T10:30:00.000Z"
}
```

### Stale Health Pages

**Detection Criteria:**
- Article category is "health"
- Article has health-related tags (health, symptom, treatment, diagnos, urgent, medical)
- Last updated > 12 months ago

**Severity Levels:**
- **High**: Not updated in 18+ months
- **Medium**: Not updated in 12-18 months
- **Low**: Not updated in < 15 months

**Example Issue:**
```typescript
{
  id: "stale-article-456",
  type: "stale_health",
  articleId: "article-456",
  articleSlug: "canine-parvovirus",
  articleTitle: "Canine Parvovirus",
  severity: "high",
  description: "Last updated 24 months ago (health content should be reviewed every 12 months)",
  detectedAt: "2025-11-10T12:00:00.000Z",
  lastUpdated: "2023-11-10T08:00:00.000Z"
}
```

### Orphaned Pages

**Detection Criteria:**
- Article has < 1 inbound link from other wiki articles

**Link Counting:**
- Related articles array
- Wiki-style links in content: `[[article-name]]`
- Tag references matching other article slugs or titles

**Severity Levels:**
- **Medium**: 0 inbound links
- **Low**: < 1 inbound link

**Example Issue:**
```typescript
{
  id: "orphaned-article-789",
  type: "orphaned",
  articleId: "article-789",
  articleSlug: "rare-bird-species",
  articleTitle: "Rare Bird Species",
  severity: "medium",
  description: "Only 0 inbound links from other wiki articles",
  detectedAt: "2025-11-10T12:00:00.000Z",
  lastUpdated: "2025-09-01T14:20:00.000Z"
}
```

## Data Structures

### QualityIssue Interface

```typescript
interface QualityIssue {
  id: string                                    // Unique issue identifier
  type: "stub" | "stale_health" | "orphaned"   // Issue type
  articleId: string                             // Article ID
  articleSlug: string                           // Article slug for URL
  articleTitle: string                          // Article title
  severity: "low" | "medium" | "high"          // Issue severity
  description: string                           // Human-readable description
  detectedAt: string                            // ISO timestamp of detection
  lastUpdated?: string                          // ISO timestamp of last article update
}
```

### QualityDashboardData Interface

```typescript
interface QualityDashboardData {
  totalArticles: number                         // Total wiki articles
  stubs: number                                 // Count of stub articles
  staleHealthPages: number                      // Count of stale health pages
  orphanedPages: number                         // Count of orphaned pages
  issuesBySeverity: {
    low: number                                 // Count of low severity issues
    medium: number                              // Count of medium severity issues
    high: number                                // Count of high severity issues
  }
  issues: QualityIssue[]                       // Array of all issues
  totalIssues: number                           // Total issue count
  healthScore: number                           // Wiki health score (0-100)
}
```

## Health Score Calculation

The wiki health score provides a single metric (0-100) representing overall content quality.

**Formula:**
```
healthScore = max(0, 100 - penalty)

where penalty = (low_count × 1) + (medium_count × 3) + (high_count × 5)
```

**Examples:**
- No issues: 100 points (perfect score)
- 5 low issues: 95 points
- 3 medium issues: 91 points
- 2 high issues: 90 points
- 10 low + 5 medium + 3 high issues: 70 points

## Integration Patterns

### Admin Dashboard Component

```typescript
"use client"

import { useEffect, useState } from "react"
import { getQualityDashboardData, type QualityDashboardData } from "@/lib/utils/quality-analytics"

export function QualityDashboard() {
  const [data, setData] = useState<QualityDashboardData | null>(null)

  useEffect(() => {
    const dashboard = getQualityDashboardData()
    setData(dashboard)
  }, [])

  if (!data) return <div>Loading...</div>

  return (
    <div className="space-y-4">
      <h2>Wiki Quality Dashboard</h2>
      
      <div className="grid grid-cols-3 gap-4">
        <div>
          <h3>Health Score</h3>
          <p className="text-3xl">{data.healthScore}/100</p>
        </div>
        <div>
          <h3>Total Articles</h3>
          <p className="text-3xl">{data.totalArticles}</p>
        </div>
        <div>
          <h3>Total Issues</h3>
          <p className="text-3xl">{data.totalIssues}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <h4>Stubs</h4>
          <p>{data.stubs}</p>
        </div>
        <div>
          <h4>Stale Health</h4>
          <p>{data.staleHealthPages}</p>
        </div>
        <div>
          <h4>Orphaned</h4>
          <p>{data.orphanedPages}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-red-600">
          <h4>High Priority</h4>
          <p>{data.issuesBySeverity.high}</p>
        </div>
        <div className="text-yellow-600">
          <h4>Medium Priority</h4>
          <p>{data.issuesBySeverity.medium}</p>
        </div>
        <div className="text-blue-600">
          <h4>Low Priority</h4>
          <p>{data.issuesBySeverity.low}</p>
        </div>
      </div>
    </div>
  )
}
```

### Issue List Component

```typescript
"use client"

import { useEffect, useState } from "react"
import { getQualityIssues, type QualityIssue } from "@/lib/utils/quality-analytics"
import Link from "next/link"

export function IssueList({ type }: { type?: "stub" | "stale_health" | "orphaned" }) {
  const [issues, setIssues] = useState<QualityIssue[]>([])

  useEffect(() => {
    const allIssues = getQualityIssues()
    const filtered = type ? allIssues.filter(i => i.type === type) : allIssues
    setIssues(filtered)
  }, [type])

  return (
    <div className="space-y-2">
      {issues.map(issue => (
        <div key={issue.id} className="border p-4 rounded">
          <div className="flex justify-between items-start">
            <div>
              <Link href={`/wiki/${issue.articleSlug}`} className="font-bold hover:underline">
                {issue.articleTitle}
              </Link>
              <p className="text-sm text-gray-600">{issue.description}</p>
            </div>
            <span className={`px-2 py-1 rounded text-xs ${
              issue.severity === "high" ? "bg-red-100 text-red-800" :
              issue.severity === "medium" ? "bg-yellow-100 text-yellow-800" :
              "bg-blue-100 text-blue-800"
            }`}>
              {issue.severity}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
```

### API Route Example

```typescript
// app/api/quality/route.ts
import { NextResponse } from "next/server"
import { getQualityDashboardData } from "@/lib/utils/quality-analytics"

export async function GET() {
  const data = getQualityDashboardData()
  return NextResponse.json(data)
}
```

## Configuration

### Thresholds

You can customize detection thresholds by modifying the constants in `lib/utils/quality-analytics.ts`:

```typescript
// Stub detection
const STUB_CONTENT_LENGTH_THRESHOLD = 200  // characters
const STUB_SECTIONS_THRESHOLD = 2          // sections

// Stale health detection
const STALE_MONTHS_THRESHOLD = 12          // months

// Orphaned page detection
const MIN_LINK_COUNT = 1                   // minimum inbound links
```

### Health Score Penalties

Adjust penalty weights in the health score calculation:

```typescript
const penalty = 
  issuesBySeverity.low * 1 +      // Low severity penalty
  issuesBySeverity.medium * 3 +   // Medium severity penalty
  issuesBySeverity.high * 5       // High severity penalty
```

## Best Practices

### For Content Creators

1. **Avoid Stubs**: Ensure articles have at least 200 characters and 2+ sections
2. **Link Articles**: Reference related articles using `[[article-name]]` syntax
3. **Update Health Content**: Review health articles annually
4. **Use Tags**: Add relevant tags to improve discoverability and linking

### For Administrators

1. **Monitor Health Score**: Track trends over time
2. **Prioritize High Severity**: Address high-severity issues first
3. **Regular Reviews**: Schedule periodic quality audits
4. **Automate Notifications**: Alert authors when their articles need updates
5. **Set Goals**: Establish target health scores and issue reduction goals

### For Developers

1. **Cache Results**: Quality analysis can be expensive; cache dashboard data
2. **Background Jobs**: Run quality checks asynchronously
3. **Incremental Updates**: Only re-analyze changed articles
4. **Performance**: Consider pagination for large issue lists
5. **Monitoring**: Track quality metrics over time in analytics

## Troubleshooting

### Issue: Health score is 0

**Cause**: Too many high-severity issues
**Solution**: Focus on resolving high-severity issues first to quickly improve the score

### Issue: Many false-positive stubs

**Cause**: Threshold too high for your content style
**Solution**: Adjust `STUB_CONTENT_LENGTH_THRESHOLD` to match your needs

### Issue: Health articles incorrectly flagged as stale

**Cause**: Tags don't match health-related patterns
**Solution**: Ensure health articles have appropriate tags (health, symptom, treatment, etc.)

### Issue: Orphaned pages not detected

**Cause**: Links not in recognized format
**Solution**: Use `[[article-name]]` wiki-style links or add to `relatedArticles` array

## Future Enhancements

Planned improvements to the quality analytics system:

- **Trend Analysis**: Track quality metrics over time
- **Email Notifications**: Alert authors about stale content
- **Automated Suggestions**: Recommend related articles to reduce orphaning
- **Citation Quality**: Check for proper citations and sources
- **Image Quality**: Detect missing or low-quality images
- **Readability Scores**: Analyze content complexity
- **Broken Link Detection**: Identify dead external links
- **Duplicate Content**: Find similar or duplicate articles
- **Category Balance**: Monitor content distribution across categories
- **Expert Review Tracking**: Monitor expert verification status

## Related Documentation

- [Wiki Implementation](./WIKI_IMPLEMENTATION.md) - Core wiki system documentation
- [Features List](../doc/FEATURES.md) - Complete feature documentation
- [Database Architecture](./DATABASE_ARCHITECTURE.md) - Database schema and patterns

---

*Last updated: November 10, 2025*
