import { PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker'
const prisma = new PrismaClient()

// function USER_GENERATOR (count: number): POST[] {
//   const newPosts: POST[] = []
//   for (let i = 0; i < count; i++) {
//     newPosts.push({
//       authorId,
//       contents: faker.lorem.text()
//     })
//   }
//   return newPosts
// }

const GENERATE_USER_COUNT = 10

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
            data: [
              { contents: faker.lorem.text() },
              { contents: faker.lorem.text() },
              { contents: faker.lorem.text() },
              { contents: faker.lorem.text() },
              { contents: faker.lorem.text() },
              { contents: faker.lorem.text() }
            ]
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
