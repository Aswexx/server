import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

interface UserData {
  id: string
  name: string
  email: string
  avatar: string
}

interface NormalLoginInfo {
  account: string
  password: string
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

async function getUser (data: NormalLoginInfo) {
  try {
    const { account, password } = data
    if (account === 'dev123' && password === '123') {
      const user = await prisma.user.findFirst({
        where: { name: 'Joe Stark' },
        include: {
          avatar: { select: { url: true } },
          bgImage: { select: { url: true } }
        }
      })

      await prisma.$disconnect()
      return user
    } else {
      return ''
    }
  } catch (err) {
    console.log(err)
    await prisma.$disconnect()
    process.exit(1)
  }
}

async function getPopUsers () {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        posts: {
          _count: 'desc'
        }
      },
      select: {
        id: true,
        name: true,
        alias: true,
        avatar: {
          select: { url: true }
        }
      },
      take: 10
    })

    await prisma.$disconnect()
    return users
  } catch (err) {
    console.log(err)
    await prisma.$disconnect()
    process.exit(1)
  }
}

export {
  upsertUser,
  getUser,
  getPopUsers
}

// main()
//   .then(async () => {
//     await prisma.$disconnect()
//   })
//   .catch(async (e) => {
//     console.error(e)
//     await prisma.$disconnect()
//     process.exit(1)
//   })
