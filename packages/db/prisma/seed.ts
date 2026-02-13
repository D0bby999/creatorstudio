import { prisma } from '../src/client'

async function main() {
  // Guard against running in production
  if (process.env.NODE_ENV === 'production') {
    console.error('Cannot run seed script in production')
    process.exit(1)
  }

  console.log('🌱 Seeding database...')

  // Upsert test users
  const user1 = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      id: 'cm1test1alice12345',
      email: 'alice@example.com',
      name: 'Alice Creator',
      emailVerified: true,
      image: 'https://i.pravatar.cc/150?u=alice',
    },
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      id: 'cm1test2bob123456',
      email: 'bob@example.com',
      name: 'Bob Designer',
      emailVerified: true,
      image: 'https://i.pravatar.cc/150?u=bob',
    },
  })

  const user3 = await prisma.user.upsert({
    where: { email: 'charlie@example.com' },
    update: {},
    create: {
      id: 'cm1test3charlie123',
      email: 'charlie@example.com',
      name: 'Charlie Developer',
      emailVerified: false,
    },
  })

  console.log(`✅ Created users: ${user1.name}, ${user2.name}, ${user3.name}`)

  // Create projects
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        name: 'Marketing Banner Design',
        type: 'canvas',
        userId: user1.id,
        data: { shapes: [], version: 1 },
        thumbnail: 'https://placehold.co/400x300/orange/white?text=Banner',
      },
    }),
    prisma.project.create({
      data: {
        name: 'Product Demo Video',
        type: 'video',
        userId: user1.id,
        data: { clips: [], duration: 30 },
        thumbnail: 'https://placehold.co/400x300/blue/white?text=Video',
      },
    }),
    prisma.project.create({
      data: {
        name: 'Social Media Graphics',
        type: 'canvas',
        userId: user2.id,
        data: { shapes: [], version: 1 },
      },
    }),
    prisma.project.create({
      data: {
        name: 'Tutorial Video Series',
        type: 'video',
        userId: user2.id,
        data: { clips: [], duration: 120 },
      },
    }),
    prisma.project.create({
      data: {
        name: 'Brand Logo Concepts',
        type: 'canvas',
        userId: user3.id,
        data: { shapes: [], version: 1 },
      },
    }),
  ])

  console.log(`✅ Created ${projects.length} projects`)

  // Create social accounts
  const socialAccounts = await Promise.all([
    prisma.socialAccount.create({
      data: {
        platform: 'instagram',
        platformUserId: 'ig_alice_12345',
        username: 'alice_creates',
        accessToken: 'mock_token_alice_ig',
        userId: user1.id,
      },
    }),
    prisma.socialAccount.create({
      data: {
        platform: 'instagram',
        platformUserId: 'ig_bob_67890',
        username: 'bob_designs',
        accessToken: 'mock_token_bob_ig',
        userId: user2.id,
      },
    }),
  ])

  console.log(`✅ Created ${socialAccounts.length} social accounts`)

  console.log('🎉 Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
