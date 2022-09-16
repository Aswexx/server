/* eslint-disable no-unused-vars */
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

enum NotifType {
  follow = 'follow',
  likePost = 'likePost',
  replyPost = 'replyPost',
  likeComment = 'likeComment',
  replyComment = 'replyComment',
  inviteChat = 'inviteChat',
  mention = 'mention'
}

async function createNotif (notifData: {[key: string]: string, notifType: NotifType}) {
  try {
    const result = await prisma.notification.create({
      data: {
        receiverId: notifData.receiverId,
        informerId: notifData.informerId,
        targetPostId: notifData.targetPostId,
        targetCommentId: notifData.targetCommentId,
        notifType: notifData.notifType
      },
      include: {
        informer: { select: { name: true } }
      }
    })

    await prisma.$disconnect()
    return result
  } catch (e) {
    console.log(e)
    await prisma.$disconnect()
  }
}

export {
  createNotif,
  NotifType
}
