# Database Standards for All Specifications

## Mandatory Database Architecture

**All features in this project MUST use Prisma ORM exclusively for database operations.**

## Core Rules

### ✅ Required Practices

1. **Import Prisma Client**
   ```typescript
   import { prisma } from '@/lib/prisma'
   // or
   import { db } from '@/lib/db'
   ```

2. **Use Prisma Methods**
   - `prisma.model.create()` for INSERT
   - `prisma.model.findUnique()` / `findMany()` for SELECT
   - `prisma.model.update()` for UPDATE
   - `prisma.model.delete()` for DELETE
   - `prisma.$transaction()` for transactions

3. **Schema Changes**
   - Edit `prisma/schema.prisma`
   - Run `npx prisma migrate dev --name description`
   - Run `npx prisma generate`

### ❌ Prohibited Practices

1. **Never use direct PostgreSQL**
   - No `pg` library imports
   - No raw SQL queries (except when absolutely necessary via `prisma.$queryRaw`)
   - No direct database connections

2. **Never bypass Prisma**
   - No other ORMs (Sequelize, TypeORM, etc.)
   - No query builders (Knex, etc.)

## Quick Examples

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
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: { sessions: true }
})
```

### Update
```typescript
await prisma.user.update({
  where: { id: userId },
  data: { displayName: 'New Name' }
})
```

### Delete (Soft Delete Preferred)
```typescript
await prisma.article.update({
  where: { id },
  data: { deletedAt: new Date() }
})
```

### Transaction
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

## Documentation References

For detailed information, see:
- **Quick Start**: `docs/QUICK_START_DATABASE.md`
- **Full Architecture**: `docs/DATABASE_ARCHITECTURE.md`
- **Migration Guide**: `docs/MIGRATION_TO_PRISMA.md`
- **Documentation Index**: `docs/DATABASE_README.md`

## Schema Location

The single source of truth for database structure:
```
prisma/schema.prisma
```

## When Writing Specifications

When creating requirements or tasks that involve data persistence:

1. **Always specify**: "Use Prisma ORM for all database operations"
2. **Reference models**: Refer to models in `prisma/schema.prisma`
3. **Include examples**: Show Prisma query examples in tasks
4. **Consider relations**: Use Prisma's relation features
5. **Plan migrations**: Include schema changes in implementation tasks

## Example Task Format

```markdown
- [ ] Create user profile update functionality
  - Use Prisma to update User model in `prisma/schema.prisma`
  - Import prisma client from `@/lib/prisma`
  - Implement `updateUserProfile` function using `prisma.user.update()`
  - Add validation before database update
  - Use transaction if updating multiple related models
  - Handle Prisma errors (P2002 for unique violations, P2025 for not found)
```

## Common Patterns

### Soft Delete
```typescript
// Mark as deleted
await prisma.model.update({
  where: { id },
  data: { deletedAt: new Date() }
})

// Query excluding deleted
await prisma.model.findMany({
  where: { deletedAt: null }
})
```

### Pagination
```typescript
await prisma.model.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize,
  orderBy: { createdAt: 'desc' }
})
```

### Relations
```typescript
await prisma.user.findUnique({
  where: { id },
  include: {
    posts: true,
    sessions: true,
    blockedUsers: true
  }
})
```

## Error Handling

```typescript
import { Prisma } from '@prisma/client'

try {
  await prisma.user.create({ data })
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      // Unique constraint violation
      throw new Error('Username already exists')
    }
  }
  throw error
}
```

## Performance Guidelines

1. **Select only needed fields**
   ```typescript
   await prisma.user.findMany({
     select: { id: true, username: true }
   })
   ```

2. **Use indexes** (in schema)
   ```prisma
   model User {
     @@index([email])
     @@index([username])
   }
   ```

3. **Batch operations**
   ```typescript
   await prisma.user.updateMany({
     where: { id: { in: userIds } },
     data: { status: 'active' }
   })
   ```

## Testing

```typescript
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

---

**This document applies to ALL specifications and implementations in this project.**

For questions, refer to the full documentation in `docs/` or consult the team.
