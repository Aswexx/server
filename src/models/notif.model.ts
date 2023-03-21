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
  mention = 'mention',
  followNewPost = 'followNewPost'
}

async function tryCatch (fn: () => Promise<any>) {
  try {
    return await fn()
  } catch (err) {
    console.log(err)
  }
}

async function getNotifs (userId: string) {
  return tryCatch(async () => {
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
  })
}

async function createNotif (notifData: { [key: string]: string, notifType: NotifType }) {
  return tryCatch(async () => {
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
  })
}

interface NotifToSave {
  receiverId: string
  informerId: string
  targetPostId?: string
  targetCommentId?: string
  notifType: NotifType
}

async function createMultiNotifs (notifsToSave: NotifToSave[]) {
  return tryCatch(async () => {
    await prisma.notification.createMany({
      data: notifsToSave
    })

    return await prisma.notification.findMany({
      where: {
        informerId: notifsToSave[0].informerId,
        notifType: 'followNewPost',
        targetPostId: notifsToSave[0].targetPostId
      },
      include: {
        informer: {
          select: { name: true, avatarUrl: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  })
}

async function createMentionNotifsThenGet (notifData: NotifToSave[]) {
  //* due to createMany func just return num of rows, so query again by findMany func.
  return tryCatch(async () => {
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
  })
}

async function updateNotif (notifId: string) {
  return tryCatch(async () => {
    await prisma.notification.update({
      where: { id: notifId },
      data: { isRead: true }
    })
  })
}

export {
  getNotifs,
  createNotif,
  createMultiNotifs,
  createMentionNotifsThenGet,
  updateNotif,
  NotifType
}
