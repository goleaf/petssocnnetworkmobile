import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

// Place names and types for generating places
const placeTypes = [
  'Dog Park',
  'Pet Store',
  'Veterinary Clinic',
  'Grooming Salon',
  'Pet-Friendly Cafe',
  'Animal Shelter',
  'Pet Hotel',
  'Training Facility',
  'Dog Beach',
  'Pet Supply Store',
  'Emergency Vet Clinic',
  'Pet Daycare',
  'Breeder',
  'Animal Hospital',
  'Pet Sitter',
  'Dog Trainer',
  'Cat Cafe',
  'Pet Photography Studio',
  'Aquarium Store',
  'Bird Shop',
  'Exotic Pet Store',
  'Reptile Store',
  'Pet Adoption Center',
  'Pet Cemetery',
  'Pet Insurance Office',
  'Pet Nutritionist',
  'Pet Behaviorist',
  'Mobile Vet Service',
  'Pet Rehabilitation Center',
  'Pet Resort'
]

const amenities = [
  'Water Fountain',
  'Shaded Areas',
  'Parking',
  'Restrooms',
  'Waste Bags Provided',
  'Separate Small Dog Area',
  'Agility Equipment',
  'Benches',
  'Picnic Areas',
  'Dog Wash Station',
  'Fenced Area',
  'Lighting',
  'Accessible',
  'Multiple Entrances',
  'Waste Disposal'
]

const rules = [
  'Dogs must be on leash',
  'Clean up after your pet',
  'No aggressive dogs allowed',
  'Max 3 dogs per person',
  'Dogs must be vaccinated',
  'Children must be supervised',
  'No food allowed in play area',
  'Respect other pet owners',
  'Keep dogs under control',
  'Follow posted hours'
]

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function getRandomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, Math.min(count, array.length))
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

async function seedBreeds() {
  console.log('Seeding breeds...')
  const breedsPath = path.join(process.cwd(), 'doc', 'seeds', 'breeds.json')
  const breedsData = JSON.parse(fs.readFileSync(breedsPath, 'utf-8'))

  for (const breedData of breedsData) {
    await prisma.breed.upsert({
      where: { name: breedData.name },
      update: {},
      create: {
        name: breedData.name,
        species: breedData.species,
        description: breedData.description || null,
        characteristics: breedData.characteristics || null,
        averageWeight: breedData.averageWeight || null,
        averageLifespan: breedData.averageLifespan || null,
        temperament: breedData.temperament || [],
        origin: breedData.origin || null,
      },
    })
  }
  console.log(`✓ Seeded ${breedsData.length} breeds`)
}

async function seedCities() {
  console.log('Seeding cities...')
  const citiesPath = path.join(process.cwd(), 'doc', 'seeds', 'cities.json')
  const citiesData = JSON.parse(fs.readFileSync(citiesPath, 'utf-8'))

  const cityRecords = []
  for (const cityData of citiesData) {
    const city = await prisma.city.upsert({
      where: {
        name_country_state: {
          name: cityData.name,
          country: cityData.country,
          state: cityData.state || null,
        },
      },
      update: {},
      create: {
        name: cityData.name,
        country: cityData.country,
        state: cityData.state || null,
        latitude: cityData.latitude || null,
        longitude: cityData.longitude || null,
        population: cityData.population || null,
      },
    })
    cityRecords.push(city)
  }
  console.log(`✓ Seeded ${cityRecords.length} cities`)
  return cityRecords
}

async function seedPlaces(cities: any[]) {
  console.log('Seeding places...')
  let totalPlaces = 0

  for (const city of cities) {
    // Check how many places already exist for this city
    const existingPlacesCount = await prisma.place.count({
      where: { cityId: city.id },
    })

    // Only seed if we don't have 30 places yet
    const placesToCreate = Math.max(0, 30 - existingPlacesCount)

    if (placesToCreate === 0) {
      continue
    }

    for (let i = 0; i < placesToCreate; i++) {
      const placeType = getRandomElement(placeTypes)
      const placeName = `${placeType} ${randomInt(1, 999)}`
      const streetNumber = randomInt(100, 9999)
      const streetNames = [
        'Main St',
        'Park Ave',
        'Oak Blvd',
        'Cedar Ln',
        'Maple Dr',
        'Elm St',
        'Pine Rd',
        'First St',
        'Second Ave',
        'Central Blvd',
      ]
      const streetName = getRandomElement(streetNames)
      const address = `${streetNumber} ${streetName}, ${city.name}, ${city.state || city.country}`
      
      // Generate coordinates near the city (within ~10km)
      const cityLat = city.latitude || randomFloat(-90, 90)
      const cityLng = city.longitude || randomFloat(-180, 180)
      const lat = cityLat + randomFloat(-0.1, 0.1)
      const lng = cityLng + randomFloat(-0.1, 0.1)

      await prisma.place.create({
        data: {
          name: placeName,
          address,
          cityId: city.id,
          latitude: lat,
          longitude: lng,
          amenities: getRandomElements(amenities, randomInt(3, 8)),
          rules: getRandomElements(rules, randomInt(2, 5)),
          moderationStatus: getRandomElement(['approved', 'pending', 'approved', 'approved']), // Mostly approved
        },
      })
      totalPlaces++
    }
  }
  console.log(`✓ Seeded ${totalPlaces} places`)
}

async function seedProducts() {
  console.log('Seeding products...')
  const productsPath = path.join(process.cwd(), 'doc', 'seeds', 'products.json')
  const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf-8'))

  for (const productData of productsData) {
    // Check if product exists by name (since we don't have a unique constraint on name)
    const existing = await prisma.product.findFirst({
      where: {
        name: productData.name,
        brand: productData.brand || null,
      },
    })

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          name: productData.name,
          brand: productData.brand || null,
          category: productData.category,
          description: productData.description || null,
          price: productData.price || null,
          currency: productData.currency || 'USD',
          imageUrl: productData.imageUrl || null,
          tags: productData.tags || [],
          inStock: productData.inStock !== undefined ? productData.inStock : true,
          rating: productData.rating || null,
          reviewCount: productData.reviewCount || 0,
        },
      })
    } else {
      await prisma.product.create({
        data: {
          name: productData.name,
          brand: productData.brand || null,
          category: productData.category,
          description: productData.description || null,
          price: productData.price || null,
          currency: productData.currency || 'USD',
          imageUrl: productData.imageUrl || null,
          tags: productData.tags || [],
          inStock: productData.inStock !== undefined ? productData.inStock : true,
          rating: productData.rating || null,
          reviewCount: productData.reviewCount || 0,
        },
      })
    }
  }
  console.log(`✓ Seeded ${productsData.length} products`)
}

async function seedWikiArticles() {
  console.log('Seeding wiki articles...')
  const wikiPath = path.join(process.cwd(), 'doc', 'seeds', 'wiki-stubs.json')
  const wikiData = JSON.parse(fs.readFileSync(wikiPath, 'utf-8'))

  const systemUserId = 'system-seed-user'

  for (const wikiStub of wikiData) {
    // Check if article already exists
    const existing = await prisma.article.findUnique({
      where: {
        slug_type: {
          slug: wikiStub.slug,
          type: wikiStub.type,
        },
      },
    })

    if (!existing) {
      const article = await prisma.article.create({
        data: {
          slug: wikiStub.slug,
          title: wikiStub.title,
          type: wikiStub.type,
          status: wikiStub.status || 'published',
          createdById: systemUserId,
        },
      })

      // Create initial revision as stub
      await prisma.revision.create({
        data: {
          articleId: article.id,
          rev: 1,
          authorId: systemUserId,
          summary: `Initial stub for ${wikiStub.title}`,
          contentJSON: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: `This is a wiki article stub for ${wikiStub.title}. Content will be expanded by the community.`,
                  },
                ],
              },
            ],
          },
          infoboxJSON: wikiStub.category
            ? {
                category: wikiStub.category,
                subcategory: wikiStub.subcategory || null,
              }
            : null,
        },
      })

      // Add tags if category exists
      if (wikiStub.category) {
        await prisma.articleTag.create({
          data: {
            articleId: article.id,
            tag: wikiStub.category,
          },
        })
        if (wikiStub.subcategory) {
          await prisma.articleTag.create({
            data: {
              articleId: article.id,
              tag: wikiStub.subcategory,
            },
          })
        }
      }
    }
  }
  console.log(`✓ Seeded ${wikiData.length} wiki article stubs`)
}

async function seedReportReasons() {
  console.log('Seeding report reasons...')
  
  const reportReasons = [
    // Content violations
    { code: 'spam', name: 'Spam', description: 'Repetitive, unwanted, or promotional content', category: 'content', severity: 'medium' },
    { code: 'misinformation', name: 'False Information', description: 'Inaccurate, misleading, or unverified claims', category: 'content', severity: 'high' },
    { code: 'inappropriate', name: 'Inappropriate Content', description: 'Offensive, vulgar, or unsuitable material', category: 'content', severity: 'high' },
    { code: 'copyright', name: 'Copyright Infringement', description: 'Unauthorized use of copyrighted material', category: 'content', severity: 'critical' },
    { code: 'impersonation', name: 'Impersonation', description: 'Pretending to be another person or organization', category: 'content', severity: 'high' },
    
    // Behavior violations
    { code: 'harassment', name: 'Harassment', description: 'Targeted bullying, threats, or intimidation', category: 'behavior', severity: 'critical' },
    { code: 'hate_speech', name: 'Hate Speech', description: 'Discriminatory language or content', category: 'behavior', severity: 'critical' },
    { code: 'trolling', name: 'Trolling', description: 'Deliberately disruptive or provocative behavior', category: 'behavior', severity: 'medium' },
    { code: 'abuse', name: 'Abuse', description: 'Verbal or emotional abuse directed at users', category: 'behavior', severity: 'critical' },
    
    // Safety violations
    { code: 'self_harm', name: 'Self-Harm Content', description: 'Depiction or promotion of self-harm', category: 'safety', severity: 'critical' },
    { code: 'animal_abuse', name: 'Animal Abuse', description: 'Depiction or promotion of animal cruelty', category: 'safety', severity: 'critical' },
    { code: 'violence', name: 'Violence', description: 'Graphic or gratuitous violence', category: 'safety', severity: 'high' },
    { code: 'illegal', name: 'Illegal Activity', description: 'Promotion or depiction of illegal acts', category: 'safety', severity: 'critical' },
    
    // Policy violations
    { code: 'spam_bot', name: 'Bot Activity', description: 'Automated bot or spam account', category: 'policy', severity: 'medium' },
    { code: 'fake_account', name: 'Fake Account', description: 'Fake or impersonated account', category: 'policy', severity: 'high' },
    { code: 'solicitation', name: 'Solicitation', description: 'Inappropriate sales or transaction attempts', category: 'policy', severity: 'low' },
    
    // Other
    { code: 'other', name: 'Other', description: 'Reason not listed above', category: 'other', severity: 'low' },
  ]
  
  for (const reason of reportReasons) {
    await prisma.reportReason.upsert({
      where: { code: reason.code },
      update: {},
      create: {
        code: reason.code,
        name: reason.name,
        description: reason.description,
        category: reason.category,
        severity: reason.severity,
        active: true,
      },
    })
  }
  console.log(`✓ Seeded ${reportReasons.length} report reasons`)
}

async function main() {
  try {
    console.log('🌱 Starting seed process...\n')

    await seedBreeds()
    const cities = await seedCities()
    await seedPlaces(cities)
    await seedProducts()
    await seedWikiArticles()
    await seedReportReasons()

    console.log('\n✅ Seed process completed successfully!')
  } catch (error) {
    console.error('❌ Error during seeding:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })

