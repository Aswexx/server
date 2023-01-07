import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

interface FollowRelation {
  followerId: string
  followedId: string
}

async function tryCatch (fn: () => Promise<any>) {
  try {
    return await fn()
  } catch (err) {
    console.log(err)
  }
}

async function findFollowers (userId: string) {
  return tryCatch(async () => {
    const followers = await prisma.followingShip.findMany({
      select: {
        followerId: true
      },
      where: { followedId: userId }
    })

    return followers
  })
}

async function addFollow (updateInfo: FollowRelation) {
  return tryCatch(async () => {
    console.log('idTOAdd', updateInfo)
    const result = await prisma.followingShip.create({
      data: {
        followerId: updateInfo.followerId,
        followedId: updateInfo.followedId
      }
    })

    return result
  })
}

async function deleteFollow (followShipId: string) {
  return tryCatch(async () => {
    console.log('idTOcancel', followShipId)
    const result = await prisma.followingShip.delete({
      where: { id: followShipId }
    })

    return result
  })
}

export { addFollow, deleteFollow, findFollowers }
