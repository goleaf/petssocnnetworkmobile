# Database Documentation Index

## 📚 Documentation Overview

This project uses **Prisma ORM exclusively** for all database operations. Below is a guide to all database-related documentation.

## 🚀 Quick Links

### For New Developers
1. **[Quick Start Guide](./QUICK_START_DATABASE.md)** - Get started with Prisma in 5 minutes
2. **[Database Architecture](./DATABASE_ARCHITECTURE.md)** - Comprehensive guide to our database setup

### For Existing Developers
1. **[Migration Guide](./MIGRATION_TO_PRISMA.md)** - Migrate from PostgreSQL/other ORMs to Prisma

### Reference
1. **Schema File**: `../prisma/schema.prisma` - Single source of truth for database structure
2. **Prisma Client**: `../lib/prisma.ts` - Singleton Prisma instance
3. **Database Helper**: `../lib/db.ts` - Convenience re-export

## 📖 Documentation Files

### [Quick Start Guide](./QUICK_START_DATABASE.md)
**Best for**: Developers who want to start using Prisma immediately

**Contents**:
- Basic CRUD operations
- Common patterns (pagination, filtering, relations)
- Schema change workflow
- Available models
- Useful commands

**Time to read**: 5 minutes

---

### [Database Architecture](./DATABASE_ARCHITECTURE.md)
**Best for**: Understanding the complete database setup and best practices

**Contents**:
- Core principles (Prisma-only access)
- Schema management
- Common operations with examples
- Advanced features (transactions, JSON fields, relations)
- Performance best practices
- Testing strategies
- Troubleshooting

**Time to read**: 15 minutes

---

### [Migration Guide](./MIGRATION_TO_PRISMA.md)
**Best for**: Developers migrating from direct PostgreSQL or other ORMs

**Contents**:
- Why Prisma?
- Step-by-step migration process
- Query conversion examples (SELECT, INSERT, UPDATE, DELETE)
- Handling special cases (raw SQL, full-text search, JSON)
- Error handling updates
- Testing your migration
- Performance considerations

**Time to read**: 20 minutes

---

## 🎯 Quick Reference

### Import Prisma
```typescript
import { prisma } from '@/lib/prisma'
// or
import { db } from '@/lib/db'
```

### Basic Operations
```typescript
// Create
const user = await prisma.user.create({ data: { ... } })

// Read
const user = await prisma.user.findUnique({ where: { id } })

// Update
await prisma.user.update({ where: { id }, data: { ... } })

// Delete (soft)
await prisma.user.update({ where: { id }, data: { deletedAt: new Date() } })
```

### Schema Changes
```bash
# 1. Edit prisma/schema.prisma
# 2. Create migration
npx prisma migrate dev --name description

# 3. Generate client
npx prisma generate
```

## 🔧 Useful Commands

```bash
# View data in browser
npx prisma studio

# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations (production)
npx prisma migrate deploy

# Seed database
npm run db:seed

# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# Format schema file
npx prisma format
```

## 📊 Available Models

Key models in `prisma/schema.prisma`:

### Core
- `User` - User accounts and authentication
- `Session` - Login sessions
- `EmailVerification` - Email change verification
- `BlockedUser` - User blocking relationships
- `MutedUser` - User muting relationships

### Content
- `Article` - Wiki articles
- `Revision` - Article revisions
- `BlogPost` - User blog posts
- `Product` - Pet products
- `Place` - Pet-friendly locations

### Pet Management
- `Breed` - Pet breed information
- (Pet models to be added)

### Moderation & Admin
- `ModerationQueue` - Content awaiting moderation
- `ModerationReport` - User reports
- `ModerationAction` - Moderation actions taken
- `ContentReport` - Content reports
- `ReportReason` - Report reason definitions

### System
- `AuditLog` - System audit trail
- `AuditQueue` - Pending audit entries
- `SearchTelemetry` - Search analytics
- `SavedSearch` - User saved searches
- `SearchAlert` - Search result alerts

### Search & Discovery
- `ArticleSearchIndex` - Article full-text search
- `BlogPostSearchIndex` - Blog post full-text search
- `Synonym` - Search synonyms
- `AliasSet` - Term aliases
- `TermBoost` - Search ranking boosts

### Location
- `City` - City information
- (Location models)

## ⚠️ Important Rules

### ✅ DO
- Use Prisma for all database operations
- Import from `@/lib/prisma` or `@/lib/db`
- Run `npx prisma generate` after schema changes
- Use transactions for multi-step operations
- Use soft deletes (set `deletedAt`) when appropriate
- Add indexes for frequently queried fields

### ❌ DON'T
- Use `pg`, `node-postgres`, or direct SQL
- Create raw database connections
- Skip migrations (always use `prisma migrate`)
- Forget to handle Prisma errors
- Fetch all fields when you only need a few
- Use `delete()` without considering soft delete

## 🐛 Troubleshooting

### Types are out of sync
```bash
npx prisma generate
```

### Migration conflicts
```bash
npx prisma migrate resolve --rolled-back <migration_name>
```

### Can't connect to database
1. Check `DATABASE_URL` in `.env`
2. Ensure database is running
3. Check connection string format

### Prisma Client not found
```bash
npm install @prisma/client
npx prisma generate
```

## 📚 External Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Error Reference](https://www.prisma.io/docs/reference/api-reference/error-reference)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)

## 🤝 Contributing

When adding new features:
1. Update `prisma/schema.prisma` with new models/fields
2. Create migration: `npx prisma migrate dev --name feature_name`
3. Generate client: `npx prisma generate`
4. Update this documentation if adding significant patterns
5. Add examples to relevant docs

## 💡 Tips

- Use Prisma Studio (`npx prisma studio`) to explore your data visually
- Enable query logging in development (already configured in `lib/prisma.ts`)
- Use `select` to fetch only needed fields for better performance
- Leverage TypeScript types generated by Prisma
- Use transactions for operations that must succeed or fail together
- Consider using `include` for related data instead of multiple queries

---

**Last Updated**: 2025-11-10

For questions or issues, consult the team or refer to the Prisma documentation.
