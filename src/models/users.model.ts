import { PrismaClient } from '@prisma/client'
import { compareSync } from '../util/bcrypt'
import jwt from 'jsonwebtoken'
const prisma = new PrismaClient()

interface UserData {
  id: string
  name: string
  email: string
  avatar: string
}

interface registerData {
  [key: string]: string
}

interface NormalLoginInfo {
  account: string
  password: string
}

function getRandomString (randomBytes: number): string {
  return require('crypto').randomBytes(randomBytes).toString('hex')
}

async function createUser (data: registerData) {
  const { email, password, name, alias, picture } = data
  try {
    // * not to save password if using google sign up
    if (password) {
      await prisma.loginInfo.create({
        data: { loginEmail: email, password }
      })
    }
    const result = await prisma.user.create({
      data: {
        name,
        email,
        alias,
        avatar: {
          create: { url: picture || 'default_avatar1.png' }
        },
        bgImage: {
          create: { url: 'default_bg1.jpg' }
        }
      }
    })

    await prisma.$disconnect()
    return result
  } catch (err) {
    await prisma.$disconnect()
    console.log(err)
    process.exit(1)
  }
}

async function upsertUser (data: UserData) {
  try {
    const { id, name, email, avatar } = data
    const alias = `${name}${getRandomString(4)}`
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

    const { account, password } = loginInfo as NormalLoginInfo

    if (account !== 'dev123') {
      const hash = await prisma.loginInfo.findUnique({
        where: { loginEmail: account },
        select: { password: true }
      })

      if (!hash) throw new Error('Data not found')
      if (!compareSync(password, hash.password)) {
        return ''
      }

      const user = await prisma.user.findFirst({
        where: { email: account },
        include: {
          avatar: { select: { url: true } },
          bgImage: { select: { url: true } },
          follow: {
            select: { follower: true }
          },
          followed: {
            select: { followedId: true }
          }
        }
      })

      await prisma.$disconnect()
      return user
    }
    //* Dev login
    const devUser = '3750f2af-1a10-4727-b9c9-6027dd8007d4'
    if (account === 'dev123' && password === '123') {
      const user = await prisma.user.findFirst({
        where: { id: devUser },
        include: {
          avatar: { select: { url: true } },
          bgImage: { select: { url: true } },
          follow: {
            select: { follower: true }
          },
          followed: {
            select: { followedId: true }
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
  }
}

async function getGoogleUser (token: string) {
  try {
    const decoded = jwt.decode(token, { json: true })
    if (!decoded) throw new Error('Can not get info from Google accesstoken')

    const { email, name, picture } = decoded
    const user = await prisma.user.findFirst({
      where: { email },
      include: {
        avatar: { select: { url: true } },
        bgImage: { select: { url: true } },
        follow: {
          select: { follower: true }
        },
        followed: {
          select: { followedId: true }
        }
      }
    })

    if (!user) {
      const newUser = await createUser({ email, name, picture, alias: `${name}_${getRandomString(4)}` })
      await prisma.$disconnect()
      return newUser
    }
    await prisma.$disconnect()
    return user
  } catch (err) {
    console.log(err)
    await prisma.$disconnect()
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
  createUser,
  getUser,
  getGoogleUser,
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
