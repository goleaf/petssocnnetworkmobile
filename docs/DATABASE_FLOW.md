# Database Architecture Flow

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  (Next.js App Router, API Routes, Server Actions)           │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Import
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Prisma Client Layer                       │
│                                                              │
│  ┌──────────────┐              ┌──────────────┐            │
│  │ lib/prisma.ts│◄─────────────│  lib/db.ts   │            │
│  │  (Singleton) │              │ (Re-export)  │            │
│  └──────────────┘              └──────────────┘            │
│         │                                                    │
│         │ Generated from                                    │
│         ▼                                                    │
│  ┌──────────────────────────────────────────┐              │
│  │      prisma/schema.prisma                │              │
│  │  (Single Source of Truth)                │              │
│  └──────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ SQL Queries
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                       │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Users   │  │ Articles │  │BlogPosts │  │ Products │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Sessions │  │  Places  │  │  Breeds  │  │   Audit  │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│                    ... and more tables ...                  │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Read Operation
```
User Request
    │
    ▼
Next.js Route/Action
    │
    ▼
import { prisma } from '@/lib/prisma'
    │
    ▼
prisma.model.findUnique({ where: { id } })
    │
    ▼
Prisma Client (Type-safe query)
    │
    ▼
PostgreSQL (SQL query)
    │
    ▼
Return typed data
    │
    ▼
Response to user
```

### Write Operation
```
User Request (with data)
    │
    ▼
Next.js Route/Action
    │
    ▼
Validate data (Zod schema)
    │
    ▼
import { prisma } from '@/lib/prisma'
    │
    ▼
prisma.model.create({ data: { ... } })
    │
    ▼
Prisma Client (Type-safe mutation)
    │
    ▼
PostgreSQL (SQL INSERT)
    │
    ▼
Return created record
    │
    ▼
Response to user
```

### Transaction Flow
```
User Request (multi-step operation)
    │
    ▼
Next.js Route/Action
    │
    ▼
prisma.$transaction(async (tx) => {
    │
    ├─► tx.user.create({ ... })
    │       │
    │       ▼
    │   PostgreSQL INSERT
    │       │
    │       ▼
    │   Return user
    │
    ├─► tx.auditLog.create({ ... })
    │       │
    │       ▼
    │   PostgreSQL INSERT
    │       │
    │       ▼
    │   Return log
    │
    └─► Commit or Rollback
})
    │
    ▼
Response to user
```

## Schema Change Flow

```
Developer
    │
    ▼
Edit prisma/schema.prisma
    │
    ▼
npx prisma migrate dev --name description
    │
    ├─► Create migration file
    │   (prisma/migrations/xxx_description/)
    │
    ├─► Apply to database
    │   (ALTER TABLE, CREATE TABLE, etc.)
    │
    └─► Generate Prisma Client
        (node_modules/@prisma/client/)
    │
    ▼
Commit migration files to git
    │
    ▼
Other developers pull changes
    │
    ▼
npx prisma migrate dev
    │
    └─► Apply migrations locally
```

## Component Interaction

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Pages   │  │Components│  │  Hooks   │  │  Forms   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ API Calls / Server Actions
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Next.js)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   API    │  │  Server  │  │  Server  │  │   Lib    │   │
│  │  Routes  │  │ Actions  │  │Components│  │Functions │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                              │                               │
│                              │ Import Prisma                 │
│                              ▼                               │
│  ┌────────────────────────────────────────────────────┐    │
│  │         import { prisma } from '@/lib/prisma'      │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Database Operations
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Prisma Client                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Query   │  │  Mutate  │  │Transaction│ │  Raw SQL │   │
│  │ Builder  │  │ Builder  │  │  Manager  │ │ (Escape) │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ SQL Queries
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL                                │
└─────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
Database Operation
    │
    ▼
Try {
    prisma.model.operation()
}
    │
    ├─► Success
    │       │
    │       ▼
    │   Return data
    │
    └─► Error
            │
            ▼
        Catch (error)
            │
            ├─► Prisma Error?
            │       │
            │       ├─► P2002 (Unique violation)
            │       │       │
            │       │       ▼
            │       │   "Already exists"
            │       │
            │       ├─► P2025 (Not found)
            │       │       │
            │       │       ▼
            │       │   "Not found"
            │       │
            │       └─► Other codes
            │               │
            │               ▼
            │           Handle accordingly
            │
            └─► Unknown Error
                    │
                    ▼
                Log and rethrow
```

## Development Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    Development Cycle                         │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. Plan Feature                                              │
│    - Identify data requirements                              │
│    - Design schema changes                                   │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Update Schema                                             │
│    - Edit prisma/schema.prisma                               │
│    - Add models, fields, relations                           │
│    - Add indexes                                             │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Create Migration                                          │
│    - npx prisma migrate dev --name feature_name              │
│    - Review generated SQL                                    │
│    - Test migration                                          │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Generate Client                                           │
│    - npx prisma generate                                     │
│    - Types are auto-generated                                │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Implement Feature                                         │
│    - Import prisma client                                    │
│    - Write type-safe queries                                 │
│    - Handle errors                                           │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Test                                                      │
│    - Unit tests with mocks                                   │
│    - Integration tests with test DB                          │
│    - Manual testing                                          │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Commit & Deploy                                           │
│    - Commit schema + migrations                              │
│    - CI runs migrations                                      │
│    - Deploy applies migrations                               │
└─────────────────────────────────────────────────────────────┘
```

## Key Principles Visualized

### ✅ Correct Flow
```
Application Code
    │
    ▼
Import Prisma
    │
    ▼
Use Prisma Methods
    │
    ▼
Type-Safe Operations
    │
    ▼
PostgreSQL
```

### ❌ Incorrect Flow (Prohibited)
```
Application Code
    │
    ▼
Import pg library  ❌
    │
    ▼
Raw SQL queries  ❌
    │
    ▼
PostgreSQL
```

## File Structure

```
project/
│
├── prisma/
│   ├── schema.prisma          # Schema definition
│   ├── seed.ts                # Seed script
│   └── migrations/            # Migration history
│       ├── 20231101_init/
│       ├── 20231102_add_users/
│       └── ...
│
├── lib/
│   ├── prisma.ts              # Prisma singleton
│   ├── db.ts                  # Convenience export
│   └── actions/               # Server actions using Prisma
│       ├── account.ts
│       ├── auth.ts
│       └── ...
│
├── app/
│   ├── api/                   # API routes using Prisma
│   │   └── users/
│   │       └── route.ts
│   └── ...
│
└── docs/
    ├── DATABASE_README.md
    ├── DATABASE_ARCHITECTURE.md
    └── ...
```

## Summary

This architecture ensures:
- **Single Source of Truth**: `prisma/schema.prisma`
- **Type Safety**: Auto-generated TypeScript types
- **Consistency**: All database access through Prisma
- **Maintainability**: Version-controlled migrations
- **Developer Experience**: Intuitive API with auto-completion

---

**For more details, see [DATABASE_README.md](./DATABASE_README.md)**
