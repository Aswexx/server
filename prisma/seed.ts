import { PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker'
const prisma = new PrismaClient()

async function main () {
  for (let i = 0; i < 2; i++) {
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
              { contents: faker.lorem.text() }]
          }
        }
      }
    })
    console.log(fakeUser)
  }
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
