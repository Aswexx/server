import { PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker'
import { generatePosts } from './seed.post'
const prisma = new PrismaClient()

// const GENERATE_USER_COUNT = 5

async function generateFakeUsersWithPosts (userCount: number, randomMaxPosts: number) {
  let generatedCount = 0
  try {
    for (let i = 0; i < userCount; i++) {
      const fakeUser = await prisma.user.create({
        data: {
          name: faker.name.findName(),
          alias: faker.name.middleName(),
          email: faker.internet.email(),
          bio: faker.lorem.paragraph(),
          avatarUrl: faker.internet.avatar(),
          bgImageUrl: faker.image.nature(640, 480, true),
          posts: {
            createMany: {
              data: generatePosts(Math.ceil(Math.random() * randomMaxPosts))
            }
          }
        }
      })
      generatedCount++
      console.log(`fake user: ${fakeUser.name} generated`)
    }
  } catch (err) {
    console.log('❌❌duplicate values generated, start retrying............')
    const leftCount = userCount - generatedCount
    generateFakeUsersWithPosts(leftCount, randomMaxPosts)
  }
}
export {
  generateFakeUsersWithPosts
}
