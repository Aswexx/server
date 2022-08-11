import { PrismaClient } from '@prisma/client'
// import { faker } from '@faker-js/faker'
import { generateFakeUsers } from './seed.user'
const prisma = new PrismaClient()

// const GENERATE_USER_COUNT = 2 // with 10 posts
// interface POST {
//   authorId: string,
//   contents: string
// }

// 9d0a38c8-0e4b-4efa-a285-81cd19ccacb9 => randy huels

// function POST_GENERATOR (authorId: string, count: number): POST[] {
//   const newPosts: POST[] = []
//   for (let i = 0; i < count; i++) {
//     newPosts.push({
//       authorId,
//       contents: faker.lorem.text()
//     })
//   }
//   return newPosts
// }

async function main () {
  // for (let i = 0; i < GENERATE_USER_COUNT; i++) {
  //   const fakeUser = await prisma.user.create({
  //     data: {
  //       name: faker.name.findName(),
  //       alias: faker.name.middleName(),
  //       email: faker.internet.email(),
  //       bio: faker.lorem.paragraph(),
  //       avatar: {
  //         create: { url: faker.internet.avatar() }
  //       },
  //       bgImage: {
  //         create: { url: faker.image.nature(640, 480, true) }
  //       },
  //       posts: {
  //         createMany: {
  //           data: [
  //             { contents: faker.lorem.text() },
  //             { contents: faker.lorem.text() },
  //             { contents: faker.lorem.text() },
  //             { contents: faker.lorem.text() },
  //             { contents: faker.lorem.text() },
  //             { contents: faker.lorem.text() },
  //             { contents: faker.lorem.text() },
  //             { contents: faker.lorem.text() },
  //             { contents: faker.lorem.text() },
  //             { contents: faker.lorem.text() }
  //           ]
  //         }
  //       }
  //     }
  //   })
  //   console.log(fakeUser)
  // }

  // await prisma.post.createMany({
  //   data: POST_GENERATOR('9d0a38c8-0e4b-4efa-a285-81cd19ccacb9', 1)
  // })

  await generateFakeUsers()
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
