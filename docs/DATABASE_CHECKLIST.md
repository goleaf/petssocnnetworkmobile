# Database Setup Checklist

Use this checklist to ensure your development environment is properly configured for Prisma.

## ✅ Initial Setup

- [x] Prisma is installed (`@prisma/client` in package.json)
- [x] Prisma CLI is available (`prisma` in package.json)
- [x] Schema file exists (`prisma/schema.prisma`)
- [x] Prisma client singleton exists (`lib/prisma.ts`)
- [x] Database helper exists (`lib/db.ts`)
- [ ] Environment variable `DATABASE_URL` is set in `.env`

## ✅ Environment Configuration

### Development
```bash
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/petssocial_dev"
```

### Test
```bash
# .env.test
DATABASE_URL="postgresql://user:password@localhost:5432/petssocial_test"
```

### Production
```bash
# Set in deployment platform (Vercel, etc.)
DATABASE_URL="postgresql://user:password@host:5432/petssocial_prod?connection_limit=10"
```

## ✅ Database Setup

- [ ] PostgreSQL is installed and running
- [ ] Development database is created
- [ ] Test database is created (optional)
- [ ] Migrations are applied: `npx prisma migrate dev`
- [ ] Prisma Client is generated: `npx prisma generate`
- [ ] Database is seeded (optional): `npm run db:seed`

## ✅ Verification

Run these commands to verify setup:

```bash
# 1. Check Prisma Client is generated
npx prisma generate

# 2. Check database connection
npx prisma db pull

# 3. View data in Prisma Studio
npx prisma studio

# 4. Run a test query
node -e "const { prisma } = require('./lib/prisma'); prisma.user.count().then(console.log)"
```

## ✅ Code Standards

- [ ] All database imports use `@/lib/prisma` or `@/lib/db`
- [ ] No `pg` or `node-postgres` imports exist
- [ ] No raw SQL queries (except via `prisma.$queryRaw` when necessary)
- [ ] All models use Prisma schema types
- [ ] Error handling uses Prisma error types

## ✅ Documentation

- [x] Database architecture documented (`docs/DATABASE_ARCHITECTURE.md`)
- [x] Quick start guide created (`docs/QUICK_START_DATABASE.md`)
- [x] Migration guide created (`docs/MIGRATION_TO_PRISMA.md`)
- [x] Documentation index created (`docs/DATABASE_README.md`)
- [x] Standards documented (`.kiro/DATABASE_STANDARDS.md`)
- [x] Summary created (`docs/DATABASE_SUMMARY.md`)
- [x] Main README updated with database info

## ✅ Specifications

- [x] Account settings spec updated with Prisma reference
- [x] User profile spec updated with Prisma reference
- [x] Pet profile spec updated with Prisma reference
- [x] AGENTS.md updated with database guidelines
- [ ] All other specs reviewed and updated

## ✅ Testing

- [ ] Unit tests mock Prisma correctly
- [ ] Integration tests use test database
- [ ] Test database can be reset: `DATABASE_URL=... npx prisma migrate reset`
- [ ] Seed script works: `npm run db:seed`

## ✅ CI/CD

- [ ] CI pipeline runs migrations
- [ ] CI pipeline generates Prisma Client
- [ ] Deployment applies migrations: `npx prisma migrate deploy`
- [ ] Environment variables are set in deployment platform

## ✅ Team Onboarding

- [ ] Team members know to use Prisma exclusively
- [ ] Team members know where documentation is
- [ ] Team members have run through quick start guide
- [ ] Team members understand schema change workflow

## Common Issues & Solutions

### Issue: "Cannot find module '@prisma/client'"
**Solution**: Run `npm install` and `npx prisma generate`

### Issue: "Environment variable not found: DATABASE_URL"
**Solution**: Create `.env` file with `DATABASE_URL` variable

### Issue: "Can't reach database server"
**Solution**: 
1. Check PostgreSQL is running
2. Verify DATABASE_URL is correct
3. Check network/firewall settings

### Issue: "Type errors with Prisma types"
**Solution**: Run `npx prisma generate` to regenerate types

### Issue: "Migration conflicts"
**Solution**: 
1. Pull latest migrations from git
2. Run `npx prisma migrate dev`
3. If conflicts persist, resolve manually or reset dev database

### Issue: "Prisma Client is outdated"
**Solution**: Run `npx prisma generate` after pulling schema changes

## Maintenance Tasks

### Daily
- [ ] Pull latest schema changes
- [ ] Run `npx prisma generate` if schema changed
- [ ] Apply new migrations: `npx prisma migrate dev`

### Weekly
- [ ] Review slow queries in logs
- [ ] Check database size and growth
- [ ] Review and optimize indexes

### Monthly
- [ ] Review and clean up old migrations
- [ ] Update Prisma version if needed
- [ ] Review database performance metrics

## Quick Commands Reference

```bash
# Development
npx prisma studio              # Open database GUI
npx prisma generate            # Generate Prisma Client
npx prisma migrate dev         # Create and apply migration
npx prisma format              # Format schema file
npm run db:seed                # Seed database

# Production
npx prisma migrate deploy      # Apply migrations (no prompts)
npx prisma generate            # Generate client

# Troubleshooting
npx prisma migrate reset       # Reset database (⚠️ deletes data)
npx prisma migrate resolve     # Resolve migration conflicts
npx prisma db pull             # Pull schema from database
npx prisma db push             # Push schema to database (dev only)

# Validation
npx prisma validate            # Validate schema file
npx prisma migrate status      # Check migration status
```

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Project Database Docs](./DATABASE_README.md)
- [Quick Start Guide](./QUICK_START_DATABASE.md)
- [Schema File](../prisma/schema.prisma)

---

**Last Updated**: 2025-11-10

Keep this checklist updated as the project evolves.
