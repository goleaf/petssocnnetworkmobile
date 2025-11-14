import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function seedLithuanianDemo() {
  console.log('🇱🇹 Seeding Lithuanian demo data...\n')

  const demoDataPath = path.join(process.cwd(), 'doc', 'seeds', 'lithuanian-demo.json')
  const demoData = JSON.parse(fs.readFileSync(demoDataPath, 'utf-8'))

  // 1. Seed Lithuanian cities
  console.log('Seeding Lithuanian cities...')
  for (const cityData of demoData.cities) {
    await prisma.city.upsert({
      where: {
        name_country_state: {
          name: cityData.name,
          country: cityData.country,
          state: cityData.state,
        },
      },
      update: {},
      create: cityData,
    })
  }
  console.log(`✓ Seeded ${demoData.cities.length} Lithuanian cities`)

  // 2. Seed demo users
  console.log('Seeding Lithuanian demo users...')
  const defaultPassword = await bcrypt.hash('Demo123!', 10)
  
  for (const userData of demoData.users) {
    await prisma.user.upsert({
      where: { id: userData.id },
      update: {
        displayName: userData.displayName,
        bio: userData.bio,
      },
      create: {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        emailVerified: true,
        passwordHash: defaultPassword,
        displayName: userData.displayName,
        bio: userData.bio,
        role: userData.role,
      },
    })
  }
  console.log(`✓ Seeded ${demoData.users.length} Lithuanian demo users`)

  // 3. Seed demo pets
  console.log('Seeding Lithuanian demo pets...')
  for (const petData of demoData.pets) {
    await prisma.pet.upsert({
      where: { id: petData.id },
      update: {
        name: petData.name,
        bio: petData.bio,
      },
      create: {
        id: petData.id,
        ownerId: petData.ownerId,
        slug: petData.slug,
        name: petData.name,
        species: petData.species,
        breed: petData.breed,
        gender: petData.gender,
        birthday: petData.birthday,
        bio: petData.bio,
      },
    })
  }
  console.log(`✓ Seeded ${demoData.pets.length} Lithuanian demo pets`)

  // 4. Find Sahar Johnson user (or create if doesn't exist)
  console.log('Finding or creating Sahar Johnson user...')
  let saharUser = await prisma.user.findFirst({
    where: {
      OR: [
        { username: 'sahar.johnson' },
        { username: 'saharjohnson' },
        { email: { contains: 'sahar' } },
      ],
    },
  })

  if (!saharUser) {
    console.log('Sahar Johnson not found, creating...')
    saharUser = await prisma.user.create({
      data: {
        id: 'user-sahar-johnson',
        username: 'sahar.johnson',
        email: 'sahar.johnson@example.com',
        emailVerified: true,
        passwordHash: defaultPassword,
        displayName: 'Sahar Johnson',
        bio: 'Pet lover exploring local communities 🐾',
        role: 'user',
      },
    })
  }
  console.log(`✓ Sahar Johnson user: ${saharUser.username} (${saharUser.id})`)

  // 5. Seed posts for local feed
  console.log('Seeding Lithuanian demo posts for local feed...')
  for (const postData of demoData.posts) {
    // Check if post already exists
    const existingPost = await prisma.post.findUnique({
      where: { id: postData.id },
    })

    if (existingPost) {
      console.log(`  Skipping existing post: ${postData.id}`)
      continue
    }

    await prisma.post.create({
      data: {
        id: postData.id,
        authorUserId: postData.authorUserId,
        postType: postData.postType,
        textContent: postData.textContent,
        petTags: postData.petTags || [],
        hashtags: postData.hashtags || [],
        location: postData.location || null,
        media: postData.media || null,
        visibility: postData.visibility || 'public',
        likesCount: postData.likesCount || 0,
        commentsCount: postData.commentsCount || 0,
        sharesCount: postData.sharesCount || 0,
        publishedAt: postData.publishedAt ? new Date(postData.publishedAt) : new Date(),
        questionData: postData.questionData || null,
        eventData: postData.eventData || null,
      },
    })
  }
  console.log(`✓ Seeded ${demoData.posts.length} Lithuanian demo posts`)

  // 6. Create some interactions (likes, comments) from Sahar Johnson
  console.log('Creating interactions from Sahar Johnson...')
  
  // Like some posts
  const postsToLike = ['post-lt-1', 'post-lt-3', 'post-lt-4', 'post-lt-8', 'post-lt-9']
  for (const postId of postsToLike) {
    try {
      await prisma.postLike.create({
        data: {
          postId,
          userId: saharUser.id,
          reactionType: 'like',
        },
      })
      
      // Update like count
      await prisma.post.update({
        where: { id: postId },
        data: { likesCount: { increment: 1 } },
      })
    } catch (error) {
      // Skip if already liked
      console.log(`  Already liked: ${postId}`)
    }
  }
  console.log(`✓ Created ${postsToLike.length} likes from Sahar Johnson`)

  // Add some comments from Sahar Johnson
  const comments = [
    {
      postId: 'post-lt-1',
      text: 'Vingio parkas yra nuostabus! Turiu aplankyti su savo šunimi! 🐕',
    },
    {
      postId: 'post-lt-4',
      text: 'Luna atrodo tokia miela! Tikiuosi ji greitai ras mylimą šeimą ❤️',
    },
    {
      postId: 'post-lt-8',
      text: 'Puiki idėja! Galbūt galėčiau atvykti su savo augintiniais 🎉',
    },
  ]

  for (const commentData of comments) {
    try {
      await prisma.comment.create({
        data: {
          postId: commentData.postId,
          authorUserId: saharUser.id,
          textContent: commentData.text,
          mentionedUserIds: [],
        },
      })

      // Update comment count
      await prisma.post.update({
        where: { id: commentData.postId },
        data: { commentsCount: { increment: 1 } },
      })
    } catch (error) {
      console.log(`  Error creating comment: ${error}`)
    }
  }
  console.log(`✓ Created ${comments.length} comments from Sahar Johnson`)

  console.log('\n✅ Lithuanian demo data seeded successfully!')
  console.log('\nDemo users (password: Demo123!):')
  console.log('  - jonas_vilnius')
  console.log('  - greta_kaunas')
  console.log('  - tomas_klaipeda')
  console.log('  - laura_vilnius')
  console.log('  - darius_kaunas')
  console.log(`  - ${saharUser.username} (can see local feed posts)`)
}

async function main() {
  try {
    await seedLithuanianDemo()
  } catch (error) {
    console.error('❌ Error during Lithuanian demo seeding:', error)
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
