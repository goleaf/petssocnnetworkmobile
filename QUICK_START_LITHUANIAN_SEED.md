# Quick Start: Lithuanian Demo Seed

## 🎯 What This Does

Creates Lithuanian demo data for testing the local feed:
- 5 Lithuanian users with pets
- 10 posts in Lithuanian
- Interactions from Sahar Johnson user

## ⚡ Quick Setup

### 1. Configure PostgreSQL

**Option A: Docker (Easiest)**
```bash
docker run --name postgres-dev -e POSTGRES_PASSWORD=password -e POSTGRES_DB=petssocial_dev -p 5432:5432 -d postgres:15
```

**Option B: Local Install**
- Download from https://www.postgresql.org/download/

### 2. Update .env
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/petssocial_dev"
```

### 3. Run Migrations
```bash
npx prisma migrate dev
```

### 4. Seed Lithuanian Data
```bash
npm run db:seed:lt
```

## ✅ Success!

You should see:
```
🇱🇹 Seeding Lithuanian demo data...
✓ Seeded 3 Lithuanian cities
✓ Seeded 5 Lithuanian demo users
✓ Seeded 5 Lithuanian demo pets
✓ Seeded 10 Lithuanian demo posts
✓ Created 5 likes from Sahar Johnson
✓ Created 3 comments from Sahar Johnson
✅ Lithuanian demo data seeded successfully!
```

## 🧪 Test It

1. Log in as any demo user (password: `Demo123!`):
   - jonas_vilnius
   - greta_kaunas
   - tomas_klaipeda
   - laura_vilnius
   - darius_kaunas

2. Or log in as Sahar Johnson to see the local feed

3. Navigate to "Local" feed tab

4. See Lithuanian posts! 🇱🇹

## 📚 More Info

- Full documentation: `doc/seeds/LITHUANIAN_DEMO.md`
- Setup guide: `doc/seeds/SETUP_INSTRUCTIONS.md`
- Summary: `LITHUANIAN_SEED_SUMMARY.md`
