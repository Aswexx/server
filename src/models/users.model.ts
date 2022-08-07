import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

interface UserData {
  id: string
  name: string
  email: string
  avatar: string
}

async function upsertUser (data: UserData) {
  try {
    const { id, name, email, avatar } = data
    const alias = `${name}${Math.ceil(Math.random() * 100)}`
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        id,
        name,
        email,
        alias,
        avatar: {
          create: { url: avatar }
        },
        bgImage: {
          create: { url: 'default' }
        }
      }
    })

    await prisma.$disconnect()

    return user
  } catch (err) {
    console.log(err)
    await prisma.$disconnect()
    process.exit(1)
  }
}

export { upsertUser }

// main()
//   .then(async () => {
//     await prisma.$disconnect()
//   })
//   .catch(async (e) => {
//     console.error(e)
//     await prisma.$disconnect()
//     process.exit(1)
//   })
