# Migration Guide: PostgreSQL to Prisma

## Overview

This guide helps you migrate from direct PostgreSQL queries to Prisma ORM. All database operations in this project must use Prisma exclusively.

## Why Prisma?

- ✅ **Type Safety**: Full TypeScript support with auto-generated types
- ✅ **Developer Experience**: Intuitive API, auto-completion, and inline documentation
- ✅ **Migrations**: Version-controlled schema changes
- ✅ **Performance**: Optimized queries and connection pooling
- ✅ **Maintainability**: Single source of truth for database schema

## Migration Steps

### Step 1: Identify Direct Database Usage

Search for these patterns in your code:
```bash
# Find pg library usage
grep -r "from 'pg'" .
grep -r "require('pg')" .

# Find raw SQL queries
grep -r "SELECT\|INSERT\|UPDATE\|DELETE" . --include="*.ts" --include="*.tsx"

# Find Pool/Client usage
grep -r "new Pool\|new Client" .
```

### Step 2: Replace Imports

**Before:**
```typescript
import { Pool, Client } from 'pg'
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
```

**After:**
```typescript
import { prisma } from '@/lib/prisma'
// or
import { db } from '@/lib/db'
```

### Step 3: Convert Queries

#### SELECT Queries

**Before (pg):**
```typescript
const result = await pool.query(
  'SELECT * FROM users WHERE id = $1',
  [userId]
)
const user = result.rows[0]
```

**After (Prisma):**
```typescript
const user = await prisma.user.findUnique({
  where: { id: userId }
})
```

#### INSERT Queries

**Before (pg):**
```typescript
const result = await pool.query(
  'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
  [username, email, passwordHash]
)
const newUser = result.rows[0]
```

**After (Prisma):**
```typescript
const newUser = await prisma.user.create({
  data: {
    username,
    email,
    passwordHash
  }
})
```

#### UPDATE Queries

**Before (pg):**
```typescript
await pool.query(
  'UPDATE users SET display_name = $1, updated_at = NOW() WHERE id = $2',
  [displayName, userId]
)
```

**After (Prisma):**
```typescript
await prisma.user.update({
  where: { id: userId },
  data: {
    displayName,
    updatedAt: new Date()
  }
})
```

#### DELETE Queries

**Before (pg):**
```typescript
await pool.query('DELETE FROM users WHERE id = $1', [userId])
```

**After (Prisma):**
```typescript
await prisma.user.delete({
  where: { id: userId }
})
```

#### Complex Queries with JOINs

**Before (pg):**
```typescript
const result = await pool.query(`
  SELECT u.*, COUNT(p.id) as post_count
  FROM users u
  LEFT JOIN posts p ON p.user_id = u.id
  WHERE u.deleted_at IS NULL
  GROUP BY u.id
  ORDER BY u.created_at DESC
  LIMIT 10
`)
```

**After (Prisma):**
```typescript
const users = await prisma.user.findMany({
  where: { deletedAt: null },
  include: {
    _count: {
      select: { posts: true }
    }
  },
  orderBy: { createdAt: 'desc' },
  take: 10
})
```

#### Transactions

**Before (pg):**
```typescript
const client = await pool.connect()
try {
  await client.query('BEGIN')
  const userResult = await client.query(
    'INSERT INTO users (...) VALUES (...) RETURNING *',
    [...]
  )
  await client.query(
    'INSERT INTO audit_logs (...) VALUES (...)',
    [...]
  )
  await client.query('COMMIT')
} catch (e) {
  await client.query('ROLLBACK')
  throw e
} finally {
  client.release()
}
```

**After (Prisma):**
```typescript
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({
    data: { ... }
  })
  await tx.auditLog.create({
    data: { ... }
  })
})
```

### Step 4: Handle Special Cases

#### Raw SQL (When Necessary)

For complex queries that Prisma doesn't support well:

```typescript
// Use Prisma's raw query methods
const result = await prisma.$queryRaw`
  SELECT * FROM users WHERE username ILIKE ${`%${search}%`}
`

// For writes
await prisma.$executeRaw`
  UPDATE users SET last_login = NOW() WHERE id = ${userId}
`
```

⚠️ **Warning**: Use raw queries sparingly. Most operations can be done with Prisma's query API.

#### Full-Text Search

**Before (pg):**
```typescript
const result = await pool.query(`
  SELECT * FROM articles
  WHERE to_tsvector('english', title || ' ' || content) @@ to_tsquery('english', $1)
`, [searchQuery])
```

**After (Prisma):**
```typescript
// Use the search index models
const results = await prisma.articleSearchIndex.findMany({
  where: {
    // Prisma doesn't natively support tsvector
    // Use raw query for complex FTS
  }
})

// Or use raw query
const results = await prisma.$queryRaw`
  SELECT a.* FROM articles a
  JOIN article_search_index asi ON asi.article_id = a.id
  WHERE asi.content @@ to_tsquery('english', ${searchQuery})
`
```

#### JSON Operations

**Before (pg):**
```typescript
await pool.query(`
  UPDATE users
  SET privacy = jsonb_set(privacy, '{profileVisibility}', '"friends"')
  WHERE id = $1
`, [userId])
```

**After (Prisma):**
```typescript
// Read current value, modify, and write back
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { privacy: true }
})

await prisma.user.update({
  where: { id: userId },
  data: {
    privacy: {
      ...user.privacy,
      profileVisibility: 'friends'
    }
  }
})
```

### Step 5: Update Connection Management

**Before (pg):**
```typescript
// Connection pool management
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000
})

// Cleanup
process.on('SIGTERM', () => {
  pool.end()
})
```

**After (Prisma):**
```typescript
// Prisma handles connection pooling automatically
// Configure in DATABASE_URL:
// postgresql://user:pass@host:5432/db?connection_limit=20

// Cleanup (if needed)
process.on('SIGTERM', async () => {
  await prisma.$disconnect()
})
```

### Step 6: Update Error Handling

**Before (pg):**
```typescript
try {
  await pool.query('INSERT INTO users ...')
} catch (error) {
  if (error.code === '23505') { // Unique violation
    throw new Error('Username already exists')
  }
  throw error
}
```

**After (Prisma):**
```typescript
import { Prisma } from '@prisma/client'

try {
  await prisma.user.create({ data: { ... } })
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') { // Unique constraint violation
      throw new Error('Username already exists')
    }
  }
  throw error
}
```

## Common Prisma Error Codes

- `P2002`: Unique constraint violation
- `P2003`: Foreign key constraint violation
- `P2025`: Record not found
- `P2016`: Query interpretation error

## Testing Your Migration

### 1. Unit Tests

Update mocks:
```typescript
// Before
jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    query: jest.fn()
  }))
}))

// After
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn()
    }
  }
}))
```

### 2. Integration Tests

Use a test database:
```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/test_db" npm test
```

### 3. Manual Testing

```bash
# Start Prisma Studio to inspect data
npx prisma studio

# Run migrations
npx prisma migrate dev

# Seed test data
npm run db:seed
```

## Performance Considerations

### 1. Select Only Needed Fields

```typescript
// ❌ Don't fetch everything
const user = await prisma.user.findUnique({ where: { id } })

// ✅ Select specific fields
const user = await prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    username: true,
    email: true
  }
})
```

### 2. Use Pagination

```typescript
const posts = await prisma.post.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize
})
```

### 3. Batch Operations

```typescript
// ❌ Don't loop
for (const userId of userIds) {
  await prisma.user.update({ where: { id: userId }, data: { ... } })
}

// ✅ Use batch operations
await prisma.user.updateMany({
  where: { id: { in: userIds } },
  data: { ... }
})
```

## Checklist

- [ ] Remove all `pg` imports
- [ ] Replace all raw SQL queries with Prisma queries
- [ ] Update connection management
- [ ] Update error handling
- [ ] Update tests and mocks
- [ ] Run migrations
- [ ] Test all database operations
- [ ] Update documentation
- [ ] Remove `pg` from package.json dependencies

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Client API Reference](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma Error Reference](https://www.prisma.io/docs/reference/api-reference/error-reference)
- Project Database Guide: `docs/DATABASE_ARCHITECTURE.md`
- Quick Start: `docs/QUICK_START_DATABASE.md`

## Need Help?

If you encounter issues during migration:
1. Check the Prisma schema: `prisma/schema.prisma`
2. Review existing Prisma usage in `lib/` directory
3. Consult the Prisma documentation
4. Ask the team for guidance
