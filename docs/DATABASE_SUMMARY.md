# Database Architecture Summary

## Executive Summary

This project uses **Prisma ORM** as the exclusive database layer. All database operations go through Prisma - no direct PostgreSQL queries or other database libraries are permitted.

## Key Points

### ✅ What We Use
- **Prisma ORM** - Type-safe database client
- **PostgreSQL** - Database provider (accessed only through Prisma)
- **Schema-first approach** - `prisma/schema.prisma` is the single source of truth

### ❌ What We Don't Use
- Direct PostgreSQL queries
- `pg` or `node-postgres` libraries
- Raw SQL (except via `prisma.$queryRaw` when absolutely necessary)
- Other ORMs (Sequelize, TypeORM, etc.)

## Quick Start

```typescript
// Import
import { prisma } from '@/lib/prisma'

// Create
const user = await prisma.user.create({ data: { ... } })

// Read
const user = await prisma.user.findUnique({ where: { id } })

// Update
await prisma.user.update({ where: { id }, data: { ... } })

// Delete (soft)
await prisma.user.update({ where: { id }, data: { deletedAt: new Date() } })
```

## Schema Management

```bash
# 1. Edit schema
vim prisma/schema.prisma

# 2. Create migration
npx prisma migrate dev --name description

# 3. Generate client
npx prisma generate
```

## Documentation Structure

1. **[DATABASE_README.md](./DATABASE_README.md)** - Documentation index and overview
2. **[QUICK_START_DATABASE.md](./QUICK_START_DATABASE.md)** - 5-minute quick start guide
3. **[DATABASE_ARCHITECTURE.md](./DATABASE_ARCHITECTURE.md)** - Comprehensive architecture guide
4. **[MIGRATION_TO_PRISMA.md](./MIGRATION_TO_PRISMA.md)** - Migration guide from PostgreSQL
5. **[../.kiro/DATABASE_STANDARDS.md](../.kiro/DATABASE_STANDARDS.md)** - Standards for specifications

## Project Files

- **Schema**: `prisma/schema.prisma` - Database schema definition
- **Client**: `lib/prisma.ts` - Singleton Prisma instance
- **Helper**: `lib/db.ts` - Convenience re-export
- **Seed**: `prisma/seed.ts` - Database seeding script

## Common Commands

```bash
# Development
npx prisma studio              # View data in browser
npx prisma generate            # Generate Prisma Client
npx prisma migrate dev         # Create and apply migration
npm run db:seed                # Seed database

# Production
npx prisma migrate deploy      # Apply migrations

# Maintenance
npx prisma format              # Format schema file
npx prisma migrate reset       # Reset database (⚠️ deletes data)
```

## Key Models

### Core
- `User`, `Session`, `EmailVerification`
- `BlockedUser`, `MutedUser`

### Content
- `Article`, `Revision`, `BlogPost`
- `Product`, `Place`, `Breed`

### Moderation
- `ModerationQueue`, `ModerationReport`, `ModerationAction`
- `ContentReport`, `ReportReason`

### System
- `AuditLog`, `AuditQueue`
- `SearchTelemetry`, `SavedSearch`, `SearchAlert`

### Search
- `ArticleSearchIndex`, `BlogPostSearchIndex`
- `Synonym`, `AliasSet`, `TermBoost`

## Best Practices

1. **Always use Prisma** - No exceptions
2. **Use transactions** - For multi-step operations
3. **Soft delete** - Prefer `deletedAt` over hard delete
4. **Select fields** - Don't fetch everything
5. **Add indexes** - For frequently queried fields
6. **Handle errors** - Use Prisma error types
7. **Type safety** - Leverage TypeScript types

## Performance Tips

```typescript
// ✅ Good - Select only needed fields
await prisma.user.findMany({
  select: { id: true, username: true }
})

// ✅ Good - Use pagination
await prisma.post.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize
})

// ✅ Good - Batch operations
await prisma.user.updateMany({
  where: { id: { in: userIds } },
  data: { status: 'active' }
})

// ❌ Bad - Fetching everything
await prisma.user.findMany()

// ❌ Bad - Loop with queries
for (const id of ids) {
  await prisma.user.update({ where: { id }, data: { ... } })
}
```

## Error Handling

```typescript
import { Prisma } from '@prisma/client'

try {
  await prisma.user.create({ data })
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': // Unique constraint
        throw new Error('Already exists')
      case 'P2025': // Not found
        throw new Error('Not found')
      default:
        throw error
    }
  }
  throw error
}
```

## Testing

```typescript
// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn()
    }
  }
}))

// Use test database
DATABASE_URL="postgresql://user:pass@localhost:5432/test_db" npm test
```

## Resources

- **Internal Docs**: `docs/DATABASE_*.md`
- **Schema**: `prisma/schema.prisma`
- **Prisma Docs**: https://www.prisma.io/docs
- **Prisma Client API**: https://www.prisma.io/docs/reference/api-reference/prisma-client-reference

## Compliance

All specifications, tasks, and implementations MUST follow these database standards. See `.kiro/DATABASE_STANDARDS.md` for specification guidelines.

---

**Last Updated**: 2025-11-10

This is the authoritative database architecture for the project. All developers must follow these guidelines.
