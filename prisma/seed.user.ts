import { PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker'
import { generatePosts } from './seed.post'
const prisma = new PrismaClient()

const GENERATE_USER_COUNT = 1

async function generateFakeUsers () {
  for (let i = 0; i < GENERATE_USER_COUNT; i++) {
    const fakeUser = await prisma.user.create({
      data: {
        name: faker.name.findName(),
        alias: faker.name.middleName(),
        email: faker.internet.email(),
        bio: faker.lorem.paragraph(),
        avatar: {
          create: { url: faker.internet.avatar() }
        },
        bgImage: {
          create: { url: faker.image.nature(640, 480, true) }
        },
        posts: {
          createMany: {
            data: generatePosts(Math.ceil(Math.random() * 10))
          }
        }
      }
    })

    console.log(`fake user: ${fakeUser.name} generated`)
  }
}

export {
  generateFakeUsers
}
