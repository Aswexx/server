import { PrismaClient } from '@prisma/client'
import { compareSync } from '../util/bcrypt'
import jwt from 'jsonwebtoken'
import { getFileFromS3 } from '../services/s3'
import crypto from 'crypto'
const prisma = new PrismaClient()

interface registerData {
  [key: string]: string
}

interface LoginInfo {
  account: string
  password: string
}

function getRandomString (randomBytes: number): string {
  return require('crypto').randomBytes(randomBytes).toString('hex')
}

async function getUsers () {
  try {
    const result = await prisma.user.findMany({
      where: { role: 'normal' },
      include: {
        _count: {
          select: {
            follow: true,
            followed: true,
            posts: true,
            comments: true
          }
        },
        posts: {
          select: {
            liked: true
          }
        },
        follow: true,
        followed: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // * 以是否直接放http url 區分假帳號與真實創建，後者需要再把 s3 key 轉成暫時性 url

    await Promise.all(result.map(async (user) => {
      if (!/^https/.exec(user.avatarUrl)) {
        const urls = await Promise.all([
          await getFileFromS3(user.bgImageUrl),
          await getFileFromS3(user.avatarUrl)
        ])
        user.bgImageUrl = urls[0]
        user.avatarUrl = urls[1]
      }

      return user
    }))

    // *****

    return result
  } catch (err) {
    await prisma.$disconnect()
    console.log(err)
  }
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

    // TODO: fix default images
    const result = await prisma.user.create({
      data: {
        name,
        email,
        alias,
        avatarUrl: picture || crypto.randomBytes(16).toString('hex'),
        bgImageUrl: crypto.randomBytes(16).toString('hex')
      }
    })

    await prisma.$disconnect()
    return result
  } catch (err) {
    await prisma.$disconnect()
    console.error(err)
  }
}

interface InfoToUpdate {
  userId: string
  alias?: string
  bio?: string
  fileKeys?: {
    backgroundImageKey?: string
    avatarKey?: string
  }
}

async function updateUser (infoToUpdate: InfoToUpdate) {
  try {
    console.log('🗺️🗺️🗺️', infoToUpdate)
    let result
    if (infoToUpdate.fileKeys) {
      result = await prisma.user.update({
        where: { id: infoToUpdate.userId },
        data: {
          alias: infoToUpdate.alias,
          bio: infoToUpdate.bio,
          bgImageUrl: infoToUpdate.fileKeys.backgroundImageKey,
          avatarUrl: infoToUpdate.fileKeys.avatarKey
        }
      })
    }

    await prisma.$disconnect()
    return result
  } catch (err) {
    await prisma.$disconnect()
    console.error(err)
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
      },
      include: {
        follower: { select: { name: true } }
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

async function getUser (userState: UserState, loginInfo?: LoginInfo) {
  try {
    if (!userState.isLoginUser) {
      return await prisma.user.findFirst({
        where: {
          id: userState.id
        },
        include: {
          follow: {
            where: { followerId: userState.id }
          },
          followed: {
            where: { followedId: userState.id }
          }
        }
      })
    }

    const { account, password } = loginInfo as LoginInfo

    const hash = await prisma.loginInfo.findUnique({
      where: { loginEmail: account },
      select: { password: true }
    })

    if (!hash) throw new Error('Data not found')
    if (!compareSync(password, hash.password)) {
      return ''
    }

    const user = await prisma.user.findFirst({
      where: {
        email: account,
        role: 'normal'
      },
      include: {
        follow: {
          select: { follower: true }
        },
        followed: {
          select: { followedId: true }
        }
      }
    })

    await prisma.$disconnect()
    // * 以是否直接放http url 區分假帳號與真實創建，後者需要再把 s3 key 轉成暫時性 url
    if (user && !/^https/.exec(user.avatarUrl)) {
      const urls = await Promise.all(
        [
          await getFileFromS3(user.bgImageUrl),
          await getFileFromS3(user.avatarUrl)
        ]
      )
      user.bgImageUrl = urls[0]
      user.avatarUrl = urls[1]
    }
    return user
  } catch (err) {
    console.log(err)
    await prisma.$disconnect()
  }
}

async function findUniqueUser (infos: { email: string, name: string, alias: string }) {
  try {
    const { email, name, alias } = infos
    const result = await prisma.user.findMany({
      where: { OR: [{ email }, { name }, { alias }] }
    })

    return result.length
  } catch (err) {
    console.error(err)
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

// async function getPopUsers (userId: string, skip: number) {
//   try {
//     const users = await prisma.user.findMany({
//       where: { id: { notIn: [userId] } },
//       orderBy: {
//         posts: {
//           _count: 'desc'
//         }
//       },
//       select: {
//         id: true,
//         name: true,
//         avatarUrl: true,
//         alias: true,
//         followed: true
//       },
//       take: 10,
//       skip
//     })

//     await prisma.$disconnect()
//     return users
//   } catch (err) {
//     console.log(err)
//     await prisma.$disconnect()
//   }
// }

async function getAdmin (loginInfo: LoginInfo) {
  try {
    const hash = await prisma.loginInfo.findFirst({
      where: { loginEmail: loginInfo.account },
      select: { password: true }
    })

    if (!hash) throw new Error('Data not found')
    if (!compareSync(loginInfo.password, hash.password)) {
      console.log('INVALID')
      return ''
    }

    const admin = await prisma.user.findFirst({
      where: {
        email: loginInfo.account,
        role: 'admin'
      }
    })

    await prisma.$disconnect()
    return admin
  } catch (err) {
    await prisma.$disconnect()
    console.error(err)
  }
}

export {
  createUser,
  updateUser,
  getUser,
  getUsers,
  getGoogleUser,
  getAdmin,
  // getPopUsers,
  findUniqueUser,
  addUserFollowShip,
  deleteUserFollowShip
}
