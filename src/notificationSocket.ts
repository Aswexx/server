import { Server } from 'socket.io'
import { EventEmitter } from 'events'
import { setOnlineUserState, getOnlineUserState, updateOnlineUserState } from './services/redis'
import { createMentionNotifsThenGet, NotifType } from './models/notif.model'
import { createMentionsThenGet } from './models/mention.model'
import { getFileFromS3 } from './services/s3'

const sponsorPaidEE = new EventEmitter()
const interactEE = new EventEmitter()

function notificationSocket (io: Server) {
  const notification = io.of('/notification')
  notification.on('connection', (socket) => {
    console.log(`a user connect to notification socket. id: ${socket.id}`)

    socket.on('setOnlineUser', async (userId) => {
      if (!userId) return
      await setOnlineUserState(userId, socket.id)
      const onlineUserState = await getOnlineUserState()
      notification.emit('onlineUsers', onlineUserState)
    })

    let interactEventHandler: (notif: { [key: string]: string }) => void

    socket.on('setChannel', (listeningUserId) => {
      console.log('notif channel created!')
      socket.join(listeningUserId)
      interactEventHandler = (notif) => {
        console.log(listeningUserId, notif)
        if (listeningUserId !== notif.receiverId) return
        notification.in(listeningUserId).emit('notification', notif)
      }

      interactEE.on('interact', interactEventHandler)

      function publishUpdateSponsorState () {
        notification.in(listeningUserId).emit('paid')
        sponsorPaidEE.removeListener('paid', publishUpdateSponsorState)
      }

      sponsorPaidEE.on('paid', publishUpdateSponsorState)
    })

    socket.on('disconnect', async (reason) => {
      console.log(`notif Client ${socket.id} disconnected.\nreason: ${reason}`)
      const onlineUserState = await updateOnlineUserState(socket.id)
      notification.emit('onlineUsers', onlineUserState)
      interactEE.removeListener('interact', interactEventHandler)
    })
  })
}

async function notificateTagedUsers (tagedContent: { [keys: string]: any }, tagedUsers: string[]) {
  console.log({ tagedContent })
  let notifs
  let mentionedUsers
  if (!Object.hasOwn(tagedContent, 'onCommentId')) {
    notifs = tagedUsers.map((userId) => {
      return {
        receiverId: userId,
        informerId: tagedContent.author.id,
        targetPostId: tagedContent.id,
        isRead: false,
        notifType: NotifType.mention
      }
    })
    mentionedUsers = tagedUsers.map((userId) => {
      return {
        postId: tagedContent.id,
        mentionedUserId: userId
      }
    })
  } else {
    notifs = tagedUsers.map((userId) => {
      return {
        receiverId: userId,
        informerId: tagedContent.authorId,
        targetCommentId: tagedContent.id,
        isRead: false,
        notifType: NotifType.mention
      }
    })
    mentionedUsers = tagedUsers.map((userId) => {
      return {
        commentId: tagedContent.id,
        mentionedUserId: userId
      }
    })
  }

  const mentions = await createMentionsThenGet(mentionedUsers)
  const notifsAfterCreate = await createMentionNotifsThenGet(notifs)

  console.log(notifs, mentions)

  if (notifsAfterCreate) {
    const infromerAvatarUrl = await getFileFromS3(
      notifsAfterCreate[0].informer.avatarUrl
    )
    const mappedNotifs = await Promise.all(
      notifsAfterCreate.map(async (notif) => {
        return {
          ...notif,
          informer: {
            name: notif.informer.name,
            avatarUrl: infromerAvatarUrl
          }
        }
      })
    )

    mappedNotifs.forEach((notif) => {
      console.log('@@@ 評論標註通知 @@@')
      interactEE.emit('interact', notif)
    })
  }
}

export {
  interactEE,
  sponsorPaidEE,
  notificateTagedUsers,
  notificationSocket
}
