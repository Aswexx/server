import { Server } from 'socket.io'
import { EventEmitter } from 'events'

const interactEE = new EventEmitter()

function notificationSocket (io: Server) {
  const notification = io.of('/notification')
  notification.on('connection', (socket) => {
    console.log(`a user connect to notification socket. id: ${socket.id}`)

    notification.emit('ready', 'hello')
    let followHandler: (notif: { [key: string]: string | { name: string } }) => void
    let inviteChatHandler: (notif: { [key: string]: string }) => void
    let replyPostHandler: (notif: { [key: string]: string }) => void
    let likePostHandler: (notif: { [key: string]: string }) => void
    let likeCommentHandler: (notif: { [key: string]: string }) => void

    socket.on('setChannel', (listeningUserId) => {
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
      interactEE.on('likePost', likePostHandler)
      interactEE.on('likeComment', likeCommentHandler)

      console.log('📧', interactEE.eventNames())
      console.log('📧follow', interactEE.listenerCount('follow'))
    })

    socket.on('disconnect', (reason) => {
      console.log(`notif Client ${socket.id} disconnected.\nreason: ${reason}`)

      interactEE.removeListener('follow', followHandler)
      interactEE.removeListener('inviteChat', inviteChatHandler)
      interactEE.removeListener('replyPost', replyPostHandler)
      interactEE.removeListener('likePost', likePostHandler)
      interactEE.removeListener('likeComment', likeCommentHandler)

      console.log('📧', interactEE.eventNames())
      console.log('📧follow', interactEE.listenerCount('follow'))
    })
  })
}

export {
  interactEE,
  notificationSocket
}
