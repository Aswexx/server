import { Server } from 'socket.io'
import { EventEmitter } from 'events'
import { setOnlineUserState, getOnlineUserState, updateOnlineUserState } from './services/redis'

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

export {
  interactEE,
  sponsorPaidEE,
  notificationSocket
}
