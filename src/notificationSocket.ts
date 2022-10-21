import { Server } from 'socket.io'
import { EventEmitter } from 'events'
import {
  setOnlineUser,
  removeOnlineUser,
  getOnlineUsers
} from './services/redis'
import schedule from 'node-schedule'

const pushOnlineUsersEE = new EventEmitter()
const interactEE = new EventEmitter()

// * push onlineUsers at the 30th second of every minute
schedule.scheduleJob('30 * * * * *', async () => {
  const users = await getOnlineUsers()
  pushOnlineUsersEE.emit('update', users)
})

function notificationSocket (io: Server) {
  const notification = io.of('/notification')
  notification.on('connection', (socket) => {
    console.log(`a user connect to notification socket. id: ${socket.id}`)

    pushOnlineUsersEE.on('update', (updatedList) => {
      socket.emit('onlineUsers', updatedList)
    })

    socket.on('setOnlineUser', async (userId) => {
      await setOnlineUser(socket.id, userId)
    })

    let followHandler: (notif: { [key: string]: string | { name: string } }) => void
    let inviteChatHandler: (notif: { [key: string]: string }) => void
    let replyPostHandler: (notif: { [key: string]: string }) => void
    let replyCommentHandler: (notif: { [key: string]: string }) => void
    let likePostHandler: (notif: { [key: string]: string }) => void
    let likeCommentHandler: (notif: { [key: string]: string }) => void

    socket.on('setChannel', (listeningUserId) => {
      console.log('notif channel created!')
      socket.join(listeningUserId)
      followHandler = (notif) => {
        // * no need to emit informer's listener
        if (listeningUserId === notif.informerId) return
        notification.in(listeningUserId).emit('notification', notif)
      }

      inviteChatHandler = (notif) => {
        if (listeningUserId !== notif.receiverId) return
        notification.in(listeningUserId).emit('notification', notif)
      }

      replyPostHandler = (notif) => {
        if (listeningUserId !== notif.receiverId) return
        notification.in(listeningUserId).emit('notification', notif)
      }

      replyCommentHandler = (notif) => {
        if (listeningUserId !== notif.receiverId) return
        notification.in(listeningUserId).emit('notification', notif)
      }

      likePostHandler = (notif) => {
        if (listeningUserId !== notif.receiverId) return
        notification.in(listeningUserId).emit('notification', notif)
      }

      likeCommentHandler = (notif) => {
        if (listeningUserId !== notif.receiverId) return
        notification.in(listeningUserId).emit('notification', notif)
      }

      interactEE.on('follow', followHandler)
      interactEE.on('inviteChat', inviteChatHandler)
      interactEE.on('replyPost', replyPostHandler)
      interactEE.on('replyComment', replyCommentHandler)
      interactEE.on('likePost', likePostHandler)
      interactEE.on('likeComment', likeCommentHandler)
    })

    socket.on('disconnect', async (reason) => {
      console.log(`notif Client ${socket.id} disconnected.\nreason: ${reason}`)
      await removeOnlineUser(socket.id)

      interactEE.removeListener('follow', followHandler)
      interactEE.removeListener('inviteChat', inviteChatHandler)
      interactEE.removeListener('replyPost', replyPostHandler)
      interactEE.removeListener('replyComment', replyCommentHandler)
      interactEE.removeListener('likePost', likePostHandler)
      interactEE.removeListener('likeComment', likeCommentHandler)
    })
  })
}

export {
  interactEE,
  notificationSocket
}
