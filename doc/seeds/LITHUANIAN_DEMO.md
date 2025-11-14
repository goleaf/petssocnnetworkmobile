# Lithuanian Demo Data

This document describes the Lithuanian demo data seed for local feed testing.

## Overview

The Lithuanian demo seed creates:
- 3 Lithuanian cities (Vilnius, Kaunas, Klaipėda)
- 5 demo users with Lithuanian profiles
- 5 demo pets
- 10 posts in Lithuanian for the local feed
- Interactions (likes, comments) from Sahar Johnson user

## Running the Seed

```bash
npm run db:seed:lt
```

## Demo Users

All demo users have the password: `Demo123!`

| Username | Display Name | Location | Bio |
|----------|--------------|----------|-----|
| jonas_vilnius | Jonas Kazlauskas | Vilnius | Šunų treneris iš Vilniaus 🐕 |
| greta_kaunas | Greta Petraitė | Kaunas | Kačių mylėtoja 🐱 Veterinarijos studentė |
| tomas_klaipeda | Tomas Jankauskas | Klaipėda | Šuniukas Max ir aš tyrinėjame Klaipėdą 🌊 |
| laura_vilnius | Laura Mockutė | Vilnius | Gyvūnų prieglauda 'Šilta Širdis' savanorė ❤️ |
| darius_kaunas | Darius Vasiliauskas | Kaunas | Profesionalus šunų kirpėjas 💈 |

## Demo Pets

| Pet Name | Species | Breed | Owner |
|----------|---------|-------|-------|
| Rex | Dog | Vokiečių aviganis | Jonas Kazlauskas |
| Milda | Cat | Maine Coon | Greta Petraitė |
| Max | Dog | Auksaspalvis retriveris | Tomas Jankauskas |
| Luna | Dog | Mišrūnas | Laura Mockutė |
| Bruno | Dog | Prancūzų buldogas | Darius Vasiliauskas |

## Posts Created

The seed creates 10 posts in Lithuanian covering various post types:
- Standard posts with photos and locations
- Question posts asking for recommendations
- Event posts for dog meetups
- Adoption posts from animal shelter
- Professional tips from pet groomer

## Sahar Johnson Integration

The seed will:
1. Find or create a user named "Sahar Johnson"
2. Create likes from Sahar Johnson on 5 posts
3. Create 3 comments from Sahar Johnson in Lithuanian

This allows Sahar Johnson to see Lithuanian posts in their local feed.

## Post Content Examples

### Post Types Included:
- 🌳 Park walk posts with location tags
- 😺 Cat photo albums
- 🌊 Beach adventures
- 🏠 Pet adoption announcements
- 💈 Professional grooming tips
- 🏥 Veterinary clinic recommendations
- 🎉 Dog meetup events
- ❤️ Animal shelter updates

### Hashtags Used:
- #VingioPark
- #ŠunųPasivaikščiojimas
- #KatėsGyvenimas
- #Įsivaikinti
- #GyvūnųPrieglauda
- #ŠunųKirpimas
- #Veterinarija
- And many more...

## Testing Local Feed

After running the seed:
1. Log in as Sahar Johnson (or any demo user)
2. Navigate to the "Local" feed tab
3. You should see posts from Lithuanian users
4. Posts are in Lithuanian language
5. Posts include location data for Vilnius, Kaunas, and Klaipėda

## Data Structure

The seed data is stored in:
- `doc/seeds/lithuanian-demo.json` - Main demo data file
- `doc/seeds/cities.json` - Updated with Lithuanian cities
- `prisma/seed-lithuanian-demo.ts` - Seed script

## Cleanup

To remove the demo data, you can:
1. Delete posts with IDs starting with `post-lt-`
2. Delete pets with IDs starting with `pet-lt-`
3. Delete users with IDs starting with `user-lt-`

Or simply reset your database and re-run the main seed.
