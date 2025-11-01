# Full-Text Search Implementation

## Overview

This document describes the PostgreSQL Full-Text Search (FTS) implementation for the pet social network application.

## Architecture

### Components

1. **API Endpoint**: `/api/search` (GET and POST)
2. **Database Schema**: PostgreSQL with FTS indexes
3. **Synonym Expansion**: Query-time synonym expansion
4. **Telemetry**: Search query logging

### Features

- **Full-Text Search** with PostgreSQL `tsvector`/`tsquery`
- **Ranking** with weighted fields (title, type, content)
- **Synonym Expansion** at query time
- **Telemetry** for search analytics
- **Pagination** support

## Database Schema

### Models

```typescript
model BlogPost {
  id          String
  petId       String
  authorId    String
  title       String
  content     String
  type        String
  // ... other fields
  
  postTags    BlogPostTag[]
  searchIndex BlogPostSearchIndex?
}

model BlogPostSearchIndex {
  postId  String @id
  content tsvector
}

model Synonym {
  id        String
  term      String @unique
  synonyms  String[]
  createdAt DateTime
  updatedAt DateTime
}

model SearchTelemetry {
  id          String
  query       String
  resultCount Int
  hasResults  Boolean
  createdAt   DateTime
  ipAddress   String?
  userAgent   String?
}
```

### Indexes

1. **GIN Index** on blog posts with weighted tsvector:
   - Title (weight A = 1.0)
   - Type (weight B = 0.5)
   - Content (weight C = 0.25)

2. **GIN Index** on synonyms for fast lookup

3. **Composite Index** on telemetry for analytics

## API Usage

### GET /api/search

Search blog posts using FTS.

**Query Parameters:**
- `q` (required): Search query string (1-200 chars)
- `limit` (optional): Results per page (1-100, default: 20)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "query": "german shepherd",
  "results": [
    {
      "id": "post-1",
      "petId": "pet-1",
      "authorId": "user-1",
      "title": "German Shepherd Training Tips",
      "snippet": "Here are some training tips...",
      "type": "blog_post",
      "relevance": 0.85
    }
  ],
  "pagination": {
    "total": 10,
    "limit": 20,
    "offset": 0
  }
}
```

**Example:**
```bash
curl "http://localhost:3000/api/search?q=training&limit=10"
```

### POST /api/search

Create or update synonyms.

**Request Body:**
```json
{
  "term": "gsd",
  "synonyms": ["german shepherd", "german shepherd dog", "alsatian"]
}
```

**Response:**
```json
{
  "id": "syn-1",
  "term": "gsd",
  "synonyms": ["german shepherd", "german shepherd dog", "alsatian"],
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"term":"lab","synonyms":["labrador","labrador retriever"]}'
```

## Synonym Expansion

Synonyms are looked up at query time and expanded before FTS:

1. Split query into terms
2. Look up each term in synonyms table
3. Append synonyms to search terms
4. Execute FTS with expanded query

**Example:**
- Query: `"training gsd"`
- Expanded: `"training gsd german shepherd german shepherd dog alsatian"`

## Ranking

Results are ranked using PostgreSQL `ts_rank_cd` with field weights:

```sql
ts_rank_cd(
  setweight(to_tsvector('english', title), 'A') ||
  setweight(to_tsvector('english', type), 'B') ||
  setweight(to_tsvector('english', content), 'C'),
  to_tsquery('english', 'query')
)
```

**Weights:**
- **A** (1.0): Title matches
- **B** (0.5): Type matches
- **C** (0.25): Content matches

## Telemetry

All searches are logged to `SearchTelemetry` for analytics:

- Query string
- Result count
- Has results flag
- Timestamp
- IP address (if available)
- User agent (if available)

## Setup

### 1. Run Migrations

```bash
# Generate Prisma migration
npx prisma migrate dev

# Or run SQL directly
psql $DATABASE_URL < prisma/migrations/001_fts_indexes.sql
```

### 2. Seed Synonyms

```bash
# Using script
ts-node scripts/seed-synonyms.ts

# Or manually via API
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"term":"gsd","synonyms":["german shepherd"]}'
```

### 3. Environment Variables

Ensure `DATABASE_URL` is set:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/pet_social?schema=public
```

## Testing

Run tests:

```bash
pnpm test app/api/search
```

**Test Coverage:**
- ✓ Query validation
- ✓ FTS search execution
- ✓ Synonym expansion
- ✓ Pagination
- ✓ Telemetry logging
- ✓ Relevance ranking
- ✓ Error handling

## Performance Considerations

1. **Indexes**: GIN indexes provide fast FTS queries
2. **Triggers**: Auto-update search index on post changes
3. **Limits**: Query and result limits prevent abuse
4. **Caching**: Consider Redis for frequent queries

## Future Enhancements

- [ ] Faceted search filters
- [ ] Autocomplete suggestions
- [ ] Search history
- [ ] Personalized rankings
- [ ] Multi-language support
- [ ] Elasticsearch migration for scale

## Troubleshooting

### Empty Results

Check:
1. Blog posts have `isDraft = false` and `privacy = 'public'`
2. FTS index is built
3. Search index sync is working

### Poor Ranking

Adjust weights in migration SQL:
```sql
setweight(to_tsvector('english', title), 'A') -- Change weight
```

### Slow Queries

1. Verify GIN indexes exist
2. Check `EXPLAIN ANALYZE` for query plan
3. Consider partial indexes for filtered queries

## References

- [PostgreSQL FTS Documentation](https://www.postgresql.org/docs/current/textsearch.html)
- [Prisma Client](https://www.prisma.io/docs/concepts/components/prisma-client)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

