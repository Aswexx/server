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

async function getNotifs (userId: string) {
  try {
    const result = await prisma.notification.findMany({
      where: { receiverId: userId },
      include: {
        informer: {
          select: { name: true, avatarUrl: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return result
  } catch (err) {
    console.error(err)
  }
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
        informer: { select: { name: true, avatarUrl: true } }
      }
    })

    return result
  } catch (e) {
    console.log(e)
  }
}

interface MentionNotifData {
  receiverId: string
  informerId: string
  targetPostId?: string
  targetCommentId?: string
  notifType: NotifType
}

async function createMentionNotifsThenGet (notifData: MentionNotifData[]) {
  //* due to createMany func just return num of rows, so query again by findMany func.
  try {
    await prisma.notification.createMany({
      data: notifData
    })

    return await prisma.notification.findMany({
      where: {
        informerId: notifData[0].informerId,
        notifType: 'mention',
        OR: [{ targetPostId: notifData[0].targetPostId }, { targetCommentId: notifData[0].targetCommentId }]
      },
      include: {
        informer: {
          select: { name: true, avatarUrl: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  } catch (e) {
    console.log(e)
  }
}

export {
  getNotifs,
  createNotif,
  createMentionNotifsThenGet,
  NotifType
}
