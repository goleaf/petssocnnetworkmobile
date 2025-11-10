# Quick Start: Database Operations

## TL;DR
- ✅ **Always use Prisma** for database operations
- ✅ Import from `@/lib/prisma` or `@/lib/db`
- ❌ **Never use** `pg`, direct SQL, or other database libraries
- 📖 Full guide: `docs/DATABASE_ARCHITECTURE.md`

## Basic Usage

### Import
```typescript
import { prisma } from '@/lib/prisma'
// or
import { db } from '@/lib/db'
```

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

// Find many
const articles = await prisma.article.findMany({
  where: { status: 'published' },
  include: { revisions: true }
})
```

### Update
```typescript
await prisma.user.update({
  where: { id: userId },
  data: { displayName: 'New Name' }
})
```

### Delete (Soft Delete)
```typescript
// Soft delete (preferred)
await prisma.article.update({
  where: { id },
  data: { deletedAt: new Date() }
})

// Hard delete (use sparingly)
await prisma.article.delete({
  where: { id }
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

## Schema Changes

### 1. Edit Schema
Edit `prisma/schema.prisma`

### 2. Create Migration
```bash
npx prisma migrate dev --name add_new_field
```

### 3. Generate Client
```bash
npx prisma generate
```

### 4. Apply in Production
```bash
npx prisma migrate deploy
```

## Common Patterns

### Pagination
```typescript
const posts = await prisma.blogPost.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize,
  orderBy: { createdAt: 'desc' }
})
```

### Relations
```typescript
const article = await prisma.article.findUnique({
  where: { id },
  include: {
    revisions: true,
    tags: true,
    sources: true
  }
})
```

### Filtering
```typescript
const users = await prisma.user.findMany({
  where: {
    deletedAt: null,
    role: 'user',
    emailVerified: true
  }
})
```

### Counting
```typescript
const count = await prisma.user.count({
  where: { role: 'admin' }
})
```

## Available Models

Key models in `prisma/schema.prisma`:
- `User` - User accounts
- `Session` - Login sessions
- `Article` - Wiki articles
- `BlogPost` - Blog posts
- `Product` - Pet products
- `Place` - Pet-friendly places
- `Breed` - Pet breeds
- `ModerationQueue` - Content moderation
- `AuditLog` - System audit trail

## Tools

### View Data
```bash
npx prisma studio
```

### Seed Database
```bash
npm run db:seed
```

### Reset Database (⚠️ Deletes all data)
```bash
npx prisma migrate reset
```

## Need Help?

- Full documentation: `docs/DATABASE_ARCHITECTURE.md`
- Prisma docs: https://www.prisma.io/docs
- Schema file: `prisma/schema.prisma`
