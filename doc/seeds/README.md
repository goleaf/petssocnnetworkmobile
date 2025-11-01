# Seed Data Files

This directory contains seed data files used by the Prisma seed script (`prisma/seed.ts`).

## Files

### breeds.json
Contains 50 pet breeds with the following information:
- Name
- Species (dog, cat, bird, rabbit, hamster, fish)
- Description
- Average weight
- Average lifespan
- Temperament traits
- Origin

### cities.json
Contains 20 major cities from around the world with:
- Name
- Country
- State/Province (if applicable)
- Latitude/Longitude coordinates
- Population

### products.json
Contains 100 pet products with:
- Name
- Brand
- Category (food, toys, accessories, health)
- Description
- Price and currency
- Tags
- Stock status
- Rating and review count

### wiki-stubs.json
Contains 200 wiki article stubs with:
- Slug (URL-friendly identifier)
- Title
- Type (wiki)
- Status (published)
- Category (care, health, training, nutrition, behavior, breeds)
- Subcategory

## Usage

The seed script is configured to be safe to rerun. It will:
- Use `upsert` for breeds and cities (preventing duplicates)
- Check existing places per city (ensures exactly 30 places per city)
- Check for existing products before creating
- Check for existing wiki articles before creating

Run the seed script with:
```bash
pnpm db:seed
# or
pnpm prisma db seed
```

## Data Sources

All seed data has been created for demonstration purposes. In a production environment, you would typically:
- Use real breed data from kennel clubs or breed registries
- Use real city data from geographical databases
- Use product data from your product catalog
- Use wiki articles created by your content team

