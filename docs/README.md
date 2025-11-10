# Pet social network

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/andrejprus-projects/v0-pet-social-network)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/rpzv0eK6R0X)

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## Deployment

Your project is live at:

**[https://vercel.com/andrejprus-projects/v0-pet-social-network](https://vercel.com/andrejprus-projects/v0-pet-social-network)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/rpzv0eK6R0X](https://v0.app/chat/rpzv0eK6R0X)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## Documentation

### Database
This project uses **Prisma ORM exclusively** for all database operations. 

- **[Database Documentation Index](./DATABASE_README.md)** - Complete guide to database docs
- **[Quick Start](./QUICK_START_DATABASE.md)** - Get started with Prisma in 5 minutes
- **[Architecture Guide](./DATABASE_ARCHITECTURE.md)** - Comprehensive database architecture
- **[Migration Guide](./MIGRATION_TO_PRISMA.md)** - Migrate from PostgreSQL to Prisma
- **[Summary](./DATABASE_SUMMARY.md)** - Executive summary

### Features
- **[Wiki Quality Analytics](./WIKI_QUALITY_ANALYTICS.md)** - Automated content quality monitoring
- **[Wiki Implementation](../doc/WIKI_IMPLEMENTATION.md)** - Wiki system architecture
- **[Features List](../doc/FEATURES.md)** - Complete feature documentation

### Key Rules
- ✅ **Always use Prisma** for database operations
- ✅ Import from `@/lib/prisma` or `@/lib/db`
- ❌ **Never use** direct PostgreSQL queries or `pg` library
- 📖 Schema: `../prisma/schema.prisma`

### Quick Example
```typescript
import { prisma } from '@/lib/prisma'

// Create
const user = await prisma.user.create({ data: { ... } })

// Read
const user = await prisma.user.findUnique({ where: { id } })

// Update
await prisma.user.update({ where: { id }, data: { ... } })
```

See [DATABASE_README.md](./DATABASE_README.md) for complete documentation.