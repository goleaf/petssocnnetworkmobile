# Wiki System Implementation

## Overview

This document describes the enhanced wiki system with infoboxed article types, revision history with diffs, citations, and expert-gated content.

## Core Features

### Article Types
- **Breed**: Pet breed information with computed tags
- **Health**: Expert-gated health condition articles (stable vs latest)
- **Place**: Pet-friendly locations and facilities
- **Product**: Pet products with recall tracking
- **Care, Training, Nutrition, Behavior**: General educational articles

### Revision System
- Full revision history with diffs
- Support for draft, pending, approved, stable, deprecated statuses
- Expert verification required for stable health articles
- Automatic diff calculation for content blocks and infobox

### Citations
- Reusable Sources (URLs, publishers, dates)
- Citations with locators (page numbers, timestamps, sections)
- Support for "citation needed" markers

### Content Blocks
- Structured content blocks (paragraph, heading, list, image, code, quote, table)
- Citations embedded at block level
- Deprecates simple markdown content

## New Types

### WikiArticleType
```typescript
export type WikiArticleType = "breed" | "health" | "place" | "product" | "care" | "training" | "nutrition" | "behavior"
```

### WikiRevisionStatus
```typescript
export type WikiRevisionStatus = "draft" | "pending" | "approved" | "rejected" | "stable" | "deprecated"
```

### HealthArticleData
- Symptoms, urgency level, risk factors
- Diagnosis methods, treatments, prevention
- Expert reviewer tracking
- Related conditions

### PlaceInfoboxData
- Location (lat/lng)
- Amenities, accessibility
- Pet policy, fees, hours

### ProductInfoboxData
- Brand, category, pricing
- Recall notices and safety information
- Ratings and reviews

## Core Functions

### createArticle
Create a new wiki article with proper type and infobox setup.

```typescript
const article = createArticle({
  type: "health",
  title: "Canine Parvovirus",
  infobox: {
    conditionName: "Canine Parvovirus",
    urgency: "emergency",
    symptoms: ["vomiting", "diarrhea", "lethargy"],
    // ... more fields
  },
  blocks: [/* content blocks */],
  authorId: "user-123",
  tags: ["health", "dogs", "infectious-disease"]
})
```

### createRevision
Create a new revision with automatic diff calculation.

```typescript
const revision = createRevision(articleId, previousRevisionId, {
  authorId: "user-123",
  blocks: [/* updated blocks */],
  infobox: { /* updated infobox */ },
  summary: "Updated treatment protocols",
  status: "pending"
})
```

### approveRevision
Approve a pending revision.

```typescript
const result = approveRevision(revisionId, approverId)
if (!result.success) {
  console.error(result.error)
}
```

### addCitation
Add a citation to a revision.

```typescript
const result = addCitation(revisionId, sourceId, "p. 42")
```

### getRelatedArticles
Find related articles using tags and link graph.

```typescript
const related = getRelatedArticles(articleId, limit = 10)
```

### getStableRevision & getLatestRevision
For health articles, separate stable (expert-approved) vs latest content.

```typescript
const stable = getStableRevision(articleId) // Expert-verified
const latest = getLatestRevision(articleId) // May be pending
```

### markRevisionAsStable
Expert-only function to publish stable content.

```typescript
const result = markRevisionAsStable(articleId, revisionId, expertId)
```

## Migration Notes

### Backward Compatibility
- The `content` field remains for legacy articles
- New articles should use `blocks` array
- All new fields are optional
- Type mapping: `category` can infer `type` if missing

### Existing Articles
Existing articles work without modification. To upgrade:

1. Convert `content` to `blocks`
2. Add `type` field
3. Migrate infobox data to type-specific fields
4. Create initial revision

### Storage
- Types defined in `lib/types.ts`
- Core functions in `lib/wiki.ts`
- Storage operations in `lib/storage.ts`

## UI Integration Points

### Editor
- Block-based editor for structured content
- Infobox forms for each article type
- Citation management UI
- Revision diff viewer

### Reader
- Infobox display sidebar
- Citation drawer
- Revision selector (stable vs latest for health)
- Related articles widget

### Moderation
- Expert verification workflow
- Revision approval queue
- Stability promotion (health articles)

## Example Workflow

### Creating a Health Article

```typescript
// 1. Create article
const article = createArticle({
  type: "health",
  title: "Canine Parvovirus",
  infobox: {
    conditionName: "Canine Parvovirus",
    urgency: "emergency",
    symptoms: ["vomiting", "diarrhea"],
    severityLevel: "life-threatening"
  },
  authorId: "vet-456",
  category: "health"
})

// 2. Expert verifies and marks stable
markRevisionAsStable(article.id, article.currentRevisionId!, "vet-456")
```

### Creating a Product Article

```typescript
// 1. Create article
const product = createArticle({
  type: "product",
  title: "Brand X Dog Food",
  infobox: {
    name: "Brand X Dog Food",
    brand: "Brand X",
    isRecalled: true,
    recallNotice: "Contaminated with Salmonella",
    recallDate: "2024-01-15"
  },
  authorId: "user-123"
})
```

### Revision with Diff

```typescript
// 1. Get current revision
const currentRev = getLatestRevision(articleId)

// 2. Create new revision
const newRev = createRevision(articleId, currentRev.id, {
  authorId: "user-456",
  blocks: updatedBlocks,
  summary: "Added treatment section"
})

// 3. Automatic diff calculated
console.log(newRev.diff)
// {
//   added: [...],
//   modified: [...],
//   deleted: [...]
// }

// 4. Approve if good
approveRevision(newRev.id, "moderator-789")
```

## Testing

Test files should cover:
- Article creation for all types
- Revision diffs calculation
- Expert verification workflow
- Citation management
- Related articles scoring

## Quality Analytics

The wiki system includes automated quality monitoring to identify and track content issues.

### Quality Issue Types

**Stub Articles**
- Detects articles with insufficient content (< 200 characters)
- Checks for minimal structure (< 2 sections)
- Severity: High (< 100 chars) or Medium (100-200 chars)

**Stale Health Pages**
- Monitors health articles for outdated information
- Flags articles not updated in 12+ months
- Severity based on age:
  - High: 18+ months old
  - Medium: 12-18 months old
  - Low: < 15 months old
- Only applies to articles with health-related tags

**Orphaned Pages**
- Identifies articles with no inbound links
- Counts links from:
  - Related articles
  - Wiki-style links `[[article]]` in content
  - Tag references
- Severity: Medium (0 links) or Low (< 1 link)

### Quality Dashboard

```typescript
import { getQualityDashboardData } from "@/lib/utils/quality-analytics"

const dashboard = getQualityDashboardData()
// Returns:
// {
//   totalArticles: number
//   stubs: number
//   staleHealthPages: number
//   orphanedPages: number
//   issuesBySeverity: { low, medium, high }
//   issues: QualityIssue[]
//   totalIssues: number
//   healthScore: number // 0-100
// }
```

### Health Score Calculation

The wiki health score (0-100) is calculated by:
- Starting with a base score of 100
- Applying penalties for each issue:
  - Low severity: -1 point
  - Medium severity: -3 points
  - High severity: -5 points
- Minimum score: 0

### API Functions

```typescript
// Get all quality issues
const issues = getQualityIssues()

// Get issues by type
const stubs = getIssuesByType("stub")
const staleHealth = getIssuesByType("stale_health")
const orphaned = getIssuesByType("orphaned")

// Get issues by severity
const highPriority = getIssuesBySeverity("high")
const mediumPriority = getIssuesBySeverity("medium")
const lowPriority = getIssuesBySeverity("low")

// Detect specific issue types
const stubIssues = detectStubs(articles)
const staleIssues = detectStaleHealthPages(articles)
const orphanedIssues = detectOrphanedPages(articles)
```

### Quality Issue Interface

```typescript
interface QualityIssue {
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
```

### Integration Points

**Admin Dashboard**
- Display quality metrics overview
- Show high-priority issues requiring attention
- Track health score trends over time

**Article Editor**
- Warn authors about stub content
- Suggest related articles to reduce orphaning
- Prompt for updates on stale health content

**Moderation Queue**
- Prioritize review of high-severity issues
- Batch operations for similar issues
- Track resolution progress

## Future Enhancements

- Translation system integration
- Watchlist notifications
- Edit request workflow
- Conflict of Interest (COI) disclosure
- Link validation for citations
- Automated quality improvement suggestions
- Quality score trends and analytics
- Email notifications for stale content owners

