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

interface FollowRelation {
  followerId: string
  followedId: string
}

async function addUserFollowShip (updateInfo: FollowRelation) {
  try {
    const result = await prisma.followingShip.create({
      data: {
        followerId: updateInfo.followerId,
        followedId: updateInfo.followedId
      }
    })

    await prisma.$disconnect()
    return result
  } catch (e) {
    console.log(e)
    await prisma.$disconnect()
    process.exit(1)
  }
}

async function deleteUserFollowShip (followShipId: string) {
  try {
    const result = await prisma.followingShip.delete({
      where: { id: followShipId }
    })

    await prisma.$disconnect()
    return result
  } catch (e) {
    console.log(e)
    await prisma.$disconnect()
    process.exit(1)
  }
}

interface UserState {
  id?: string,
  isLoginUser: boolean
}

async function getUser (userState: UserState, loginInfo?: NormalLoginInfo) {
  try {
    if (!userState.isLoginUser) {
      return await prisma.user.findFirst({
        where: { id: userState.id },
        include: {
          avatar: { select: { url: true } },
          bgImage: { select: { url: true } },
          follow: {
            where: { followerId: userState.id }
          },
          followed: {
            where: { followedId: userState.id }
          }
        }
      })
    }

    const devUser = 'a27e52a2-14e3-401e-82d2-19356adbbb81'
    const { account, password } = loginInfo as NormalLoginInfo
    if (account === 'dev123' && password === '123') {
      const user = await prisma.user.findFirst({
        where: { name: 'Nelson Bailey' },
        include: {
          avatar: { select: { url: true } },
          bgImage: { select: { url: true } },
          follow: {
            where: { followerId: devUser }
          },
          followed: {
            where: { followedId: devUser }
          }
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

async function getPopUsers (userId: string) {
  try {
    const users = await prisma.user.findMany({
      where: { id: { notIn: [userId] } },
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
        },
        followed: true
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
  getPopUsers,
  addUserFollowShip,
  deleteUserFollowShip
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
