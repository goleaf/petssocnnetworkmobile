# Lithuanian Demo Data - Setup Instructions

## ⚠️ Database Configuration Required

The Lithuanian demo seed requires a PostgreSQL database connection. Currently, your `.env` file is configured for SQLite:

```env
DATABASE_URL="file:./dev.db"
```

## Setup Steps

### 1. Configure PostgreSQL Database

Update your `.env` file with a PostgreSQL connection string:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
```

**Options for PostgreSQL:**

#### Option A: Local PostgreSQL
Install PostgreSQL locally:
- Windows: Download from https://www.postgresql.org/download/windows/
- Mac: `brew install postgresql`
- Linux: `sudo apt-get install postgresql`

Then create a database:
```bash
createdb petssocial_dev
```

#### Option B: Docker PostgreSQL
```bash
docker run --name postgres-dev -e POSTGRES_PASSWORD=password -e POSTGRES_DB=petssocial_dev -p 5432:5432 -d postgres:15
```

Then set:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/petssocial_dev"
```

#### Option C: Cloud PostgreSQL
Use a cloud provider like:
- Supabase (free tier available)
- Railway
- Neon
- Heroku Postgres

### 2. Run Migrations

After configuring PostgreSQL, run migrations to create the database schema:

```bash
npx prisma migrate dev
```

### 3. Run the Lithuanian Demo Seed

```bash
npm run db:seed:lt
```

This will create:
- ✅ 3 Lithuanian cities (Vilnius, Kaunas, Klaipėda)
- ✅ 5 demo users with Lithuanian profiles
- ✅ 5 demo pets
- ✅ 10 posts in Lithuanian for the local feed
- ✅ Interactions from Sahar Johnson user

## What Was Created

### Files Created:
1. **`doc/seeds/lithuanian-demo.json`** - Demo data in JSON format
2. **`prisma/seed-lithuanian-demo.ts`** - Seed script
3. **`doc/seeds/LITHUANIAN_DEMO.md`** - Documentation
4. **`doc/seeds/cities.json`** - Updated with Lithuanian cities

### Package.json Script Added:
```json
"db:seed:lt": "tsx prisma/seed-lithuanian-demo.ts"
```

## Demo Users

All users have password: `Demo123!`

| Username | Display Name | Location |
|----------|--------------|----------|
| jonas_vilnius | Jonas Kazlauskas | Vilnius |
| greta_kaunas | Greta Petraitė | Kaunas |
| tomas_klaipeda | Tomas Jankauskas | Klaipėda |
| laura_vilnius | Laura Mockutė | Vilnius |
| darius_kaunas | Darius Vasiliauskas | Kaunas |

## Testing the Local Feed

After seeding:

1. **Log in as Sahar Johnson** (or create this user if it doesn't exist)
2. **Navigate to the "Local" feed tab**
3. **You should see:**
   - Posts from Lithuanian users
   - Content in Lithuanian language
   - Location tags for Lithuanian cities
   - Various post types (standard, photos, questions, events)

## Post Examples Created

The seed creates diverse content:
- 🌳 Park walks with Rex in Vingio Park
- 😺 Cat photos of Milda
- 🌊 Beach adventures in Klaipėda
- 🏠 Pet adoption posts from animal shelter
- 💈 Professional grooming tips
- 🏥 Veterinary recommendations
- 🎉 Dog meetup events
- ❤️ Animal shelter updates

## Hashtags Included

Lithuanian hashtags for discoverability:
- #VingioPark
- #ŠunųPasivaikščiojimas (Dog Walks)
- #KatėsGyvenimas (Cat Life)
- #Įsivaikinti (Adopt)
- #GyvūnųPrieglauda (Animal Shelter)
- #ŠunųKirpimas (Dog Grooming)
- #Veterinarija (Veterinary)

## Troubleshooting

### Error: "the URL must start with the protocol `postgresql://`"
- Your DATABASE_URL is not configured for PostgreSQL
- Follow Step 1 above to configure PostgreSQL

### Error: "relation does not exist"
- Run migrations: `npx prisma migrate dev`
- Generate Prisma client: `npx prisma generate`

### Seed runs but no data appears
- Check that your database connection is working
- Verify migrations have been applied
- Check for errors in the seed output

## Next Steps

Once seeded successfully:

1. **Test the local feed** with Sahar Johnson user
2. **Verify Lithuanian content** appears correctly
3. **Check interactions** (likes, comments) work
4. **Test location-based filtering** if implemented

## Cleanup

To remove demo data:
```sql
-- Delete Lithuanian demo posts
DELETE FROM posts WHERE id LIKE 'post-lt-%';

-- Delete Lithuanian demo pets
DELETE FROM pets WHERE id LIKE 'pet-lt-%';

-- Delete Lithuanian demo users
DELETE FROM users WHERE id LIKE 'user-lt-%';
```

Or reset the entire database:
```bash
npx prisma migrate reset
```

## Support

For issues or questions:
1. Check the main seed documentation: `doc/seeds/README.md`
2. Review database architecture: `docs/DATABASE_ARCHITECTURE.md`
3. Check Prisma documentation: https://www.prisma.io/docs
