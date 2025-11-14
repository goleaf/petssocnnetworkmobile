# Database Architecture

## Overview

This project uses **Prisma ORM** as the exclusive database layer. All database operations must go through Prisma - direct PostgreSQL queries or other database libraries are not permitted.

## Database Provider

The project is configured to use PostgreSQL as the database provider, but **all interactions happen through Prisma**:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## Core Principles

### 1. Prisma-Only Access
- ✅ **DO**: Use Prisma Client for all database operations
- ❌ **DON'T**: Use `pg`, `node-postgres`, or direct SQL queries
- ❌ **DON'T**: Use raw database connections

### 2. Centralized Client
All database access goes through the singleton Prisma client:

```typescript
// Import from lib/prisma.ts or lib/db.ts
import { prisma } from '@/lib/prisma'
// or
import { db } from '@/lib/db'

// Use Prisma methods
const users = await prisma.user.findMany()
const article = await prisma.article.create({ data: {...} })
```

### 3. Type Safety
Prisma provides full TypeScript type safety:

```typescript
import { User, Article, Prisma } from '@prisma/client'

// Types are automatically generated from schema.prisma
const user: User = await prisma.user.findUnique({ where: { id } })
```

## Schema Management

### Location
The database schema is defined in `prisma/schema.prisma`

### Key Models
- **User**: User accounts and authentication with privacy and notification settings
- **Session**: Login sessions with device tracking and geolocation
- **EmailVerification**: Email change verification tokens
- **BlockedUser**: User blocking relationships
- **MutedUser**: User muting relationships
- **Article**: Wiki articles with revisions
- **BlogPost**: User blog posts
- **Product**: Pet products
- **Place**: Pet-friendly locations
- **Breed**: Pet breed information
- **EditRequest**: Content edit requests for moderation workflow
- **ModerationQueue**: Content moderation
- **AuditLog**: System audit trail
- **SearchTelemetry**: Search analytics

### Migrations
```bash
# Create a new migration
npx prisma migrate dev --name description_of_changes

# Apply migrations in production
npx prisma migrate deploy

# Generate Prisma Client after schema changes
npx prisma generate
```

## Common Operations

### Create
```typescript
const user = await prisma.user.create({
  data: {
    username: 'johndoe',
    email: 'john@example.com',
    passwordHash: hashedPassword
  }
})
```

### Read
```typescript
// Find one
const user = await prisma.user.findUnique({
  where: { id: userId }
})

// Find many with filters
const articles = await prisma.article.findMany({
  where: {
    status: 'published',
    deletedAt: null
  },
  include: {
    revisions: true,
    tags: true
  }
})
```

### Update
```typescript
const updated = await prisma.user.update({
  where: { id: userId },
  data: {
    displayName: 'New Name',
    updatedAt: new Date()
  }
})
```

### Delete (Soft Delete Pattern)
```typescript
// Soft delete - mark as deleted
await prisma.article.update({
  where: { id: articleId },
  data: {
    deletedAt: new Date()
  }
})

// Hard delete (use sparingly)
await prisma.article.delete({
  where: { id: articleId }
})
```

### Transactions
```typescript
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: userData })
  await tx.auditLog.create({
    data: {
      actorId: user.id,
      action: 'create',
      targetType: 'user',
      targetId: user.id
    }
  })
})
```

## Account Settings Models

### User Model Extensions
The User model includes fields for account security and privacy:

```typescript
model User {
  // Security fields
  passwordChangedAt      DateTime?
  sessionInvalidatedAt   DateTime?
  
  // Privacy settings (JSON)
  privacy                Json?
  notificationSettings   Json?
  
  // Search visibility
  searchIndexingEnabled  Boolean @default(true)
  showInSearch          Boolean @default(true)
  showInRecommendations Boolean @default(true)
  
  // Account deletion
  deletionScheduledAt   DateTime?
  deletionReason        String?
  
  // Relations
  emailVerifications    EmailVerification[]
  sessions              Session[]
  blockedUsers          BlockedUser[] @relation("UserBlocks")
  blockedBy             BlockedUser[] @relation("UserBlockedBy")
  mutedUsers            MutedUser[] @relation("UserMutes")
  mutedBy               MutedUser[] @relation("UserMutedBy")
}
```

### EmailVerification Model
Handles email change verification with secure tokens:

```typescript
model EmailVerification {
  id           String   @id @default(cuid())
  userId       String
  pendingEmail String
  token        String   @unique
  expiresAt    DateTime
  createdAt    DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([token])
  @@index([expiresAt])
}
```

### Session Model
Tracks active user sessions with device and location information:

```typescript
model Session {
  id             String   @id @default(cuid())
  userId         String
  token          String   @unique
  customName     String?
  deviceName     String?
  deviceType     String?
  os             String?
  browser        String?
  ip             String?
  city           String?
  country        String?
  revoked        Boolean  @default(false)
  createdAt      DateTime @default(now())
  lastActivityAt DateTime @default(now())
  expiresAt      DateTime
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([token])
  @@index([revoked])
  @@index([expiresAt])
}
```

### BlockedUser Model
Manages user blocking relationships:

```typescript
model BlockedUser {
  id        String   @id @default(cuid())
  userId    String
  blockedId String
  blockedAt DateTime @default(now())
  
  user    User @relation("UserBlocks", fields: [userId], references: [id], onDelete: Cascade)
  blocked User @relation("UserBlockedBy", fields: [blockedId], references: [id], onDelete: Cascade)
  
  @@unique([userId, blockedId])
  @@index([userId])
  @@index([blockedId])
}
```

### MutedUser Model
Manages user muting relationships:

```typescript
model MutedUser {
  id      String   @id @default(cuid())
  userId  String
  mutedId String
  mutedAt DateTime @default(now())
  
  user  User @relation("UserMutes", fields: [userId], references: [id], onDelete: Cascade)
  muted User @relation("UserMutedBy", fields: [mutedId], references: [id], onDelete: Cascade)
  
  @@unique([userId, mutedId])
  @@index([userId])
  @@index([mutedId])
}
```

### EditRequest Model
Manages content edit requests for moderation workflow:

```typescript
model EditRequest {
  id               String   @id @default(cuid())
  contentType      String   // 'blog' | 'wiki' | 'pet' | 'profile'
  contentId        String
  userId           String
  changes          Json     // Structured diff of changes
  reason           String?
  status           String   @default("pending") // 'pending' | 'approved' | 'rejected'
  priority         String   @default("normal")  // 'low' | 'normal' | 'high' | 'urgent'
  reviewedBy       String?
  reviewedAt       DateTime?
  isCOI            Boolean  @default(false)
  isFlaggedHealth  Boolean  @default(false)
  isNewPage        Boolean  @default(false)
  hasImages        Boolean  @default(false)
  categories       String[] @default([])
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  
  user     User  @relation("UserEditRequests", fields: [userId], references: [id], onDelete: Cascade)
  reviewer User? @relation("ReviewerEditRequests", fields: [reviewedBy], references: [id])
  
  @@index([userId])
  @@index([reviewedBy])
  @@index([status])
  @@index([contentType])
  @@index([priority])
  @@index([createdAt])
  @@index([isCOI])
  @@index([isFlaggedHealth])
  @@index([isNewPage])
  @@index([hasImages])
}
```

**Storage Layer**: `lib/storage/edit-requests.ts`

**Key Operations**:
- `createEditRequest()` - Create new edit request
- `getEditRequest()` - Retrieve edit request by ID with user/reviewer relations
- `updateEditRequest()` - Update edit request fields
- `deleteEditRequest()` - Delete edit request
- `listEditRequests()` - Query with filtering and pagination
- `getQueueItems()` - Get specialized queue items (new-pages, flagged-health, coi-edits, image-reviews)
- `getRecentChanges()` - Get recent changes feed
- `approveEditRequest()` - Approve and apply changes with transaction
- `rejectEditRequest()` - Reject with reason and notification

**Diff Calculation Utilities** (`lib/diff-utils.ts`):
- `calculateEditRequestDiff()` - Core diff calculation for any content object
- `calculateBlogDiff()` - Blog post diff calculation
- `calculateWikiDiff()` - Wiki article diff calculation
- `calculatePetDiff()` - Pet profile diff calculation
- `calculateProfileDiff()` - User profile diff calculation

**Usage Example**:
```typescript
import {
  createEditRequest,
  listEditRequests,
  approveEditRequest
} from '@/lib/storage/edit-requests';
import { calculateBlogDiff } from '@/lib/diff-utils';

// Calculate structured diff
const originalPost = await prisma.blogPost.findUnique({ where: { id: 'post_123' } });
const changes = calculateBlogDiff(
  { title: originalPost.title, content: originalPost.content },
  { title: 'New Title', content: 'Updated content' }
);

// Create edit request with calculated diff
const editRequest = await createEditRequest({
  contentType: 'blog',
  contentId: 'post_123',
  userId: 'user_456',
  changes, // Structured diff: { title: { old: '...', new: '...', type: 'modified' } }
  reason: 'Fixed typo in title',
  priority: 'normal'
});

// Query pending edits
const { items, total } = await listEditRequests(
  { status: ['pending'], contentType: ['blog'] },
  { page: 1, limit: 20 }
);

// Approve edit request (applies changes in transaction)
await approveEditRequest(editRequest.id, 'moderator_789');
```

## Advanced Features

### Full-Text Search
While Prisma doesn't natively support PostgreSQL's full-text search, we handle it through:
1. Dedicated search index models (`ArticleSearchIndex`, `BlogPostSearchIndex`)
2. Raw SQL migrations for tsvector columns
3. Prisma queries on the index models

### JSON Fields
```typescript
// Schema
model User {
  privacy Json?
  notificationSettings Json?
}

// Usage
await prisma.user.update({
  where: { id },
  data: {
    privacy: {
      profileVisibility: 'friends',
      showEmail: false
    }
  }
})
```

### Relations
```typescript
// Include related data
const article = await prisma.article.findUnique({
  where: { id },
  include: {
    revisions: {
      orderBy: { rev: 'desc' },
      take: 5
    },
    tags: true,
    sources: true
  }
})
```

## Performance Best Practices

### 1. Use Select to Limit Fields
```typescript
const users = await prisma.user.findMany({
  select: {
    id: true,
    username: true,
    avatarUrl: true
  }
})
```

### 2. Pagination
```typescript
const posts = await prisma.blogPost.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize,
  orderBy: { createdAt: 'desc' }
})
```

### 3. Indexes
Ensure proper indexes in schema.prisma:
```prisma
model Article {
  @@index([deletedAt])
  @@index([status])
  @@index([createdAt])
}
```

### 4. Connection Pooling
Prisma handles connection pooling automatically. Configure in DATABASE_URL:
```
postgresql://user:password@host:5432/db?connection_limit=10
```

## Testing

### Unit Tests
```typescript
import { prisma } from '@/lib/prisma'

// Mock Prisma in tests
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn()
    }
  }
}))
```

### Integration Tests
Use a test database:
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/test_db" npm test
```

## Seeding

Seed data is defined in `prisma/seed.ts`:
```bash
npm run db:seed
```

## Troubleshooting

### Regenerate Client
If types are out of sync:
```bash
npx prisma generate
```

### Reset Database
⚠️ **Warning**: This deletes all data
```bash
npx prisma migrate reset
```

### View Data
```bash
npx prisma studio
```

## Migration from Other ORMs

If migrating from direct PostgreSQL or other ORMs:

1. **Identify all database queries** in the codebase
2. **Replace with Prisma equivalents**:
   - `SELECT` → `prisma.model.findMany()`
   - `INSERT` → `prisma.model.create()`
   - `UPDATE` → `prisma.model.update()`
   - `DELETE` → `prisma.model.delete()`
3. **Update imports** to use `@/lib/prisma`
4. **Test thoroughly** with the new Prisma queries

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- Project Schema: `prisma/schema.prisma`
