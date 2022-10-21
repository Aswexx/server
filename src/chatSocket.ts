import { Server } from 'socket.io'
import {
  setChatRoom,
  checkRoomExist,
  saveMsgRecord,
  loadChatRecord
} from './services/redis'
import crypto from 'crypto'

const uid = () => crypto.randomBytes(8).toString('hex')

function chatSocket (io: Server) {
  const chat = io.of('/chat')
  chat.on('connection', (socket) => {
    console.log(`a user connect to chat socket. id: ${socket.id}`)

    socket.on('startChat', async (roomInfo) => {
      const { triggerUser, targetUser } = roomInfo
      console.log(triggerUser, targetUser)
      // * check is chat room exist or using new unique roomId then load chat record
      const key = JSON.stringify({ triggerUser, targetUser })
      const existRoomId = await checkRoomExist(key)
      let roomId
      if (existRoomId) {
        roomId = existRoomId
        const chatRecord = await loadChatRecord(existRoomId)
        socket.emit('existRoomId', { existRoomId, chatRecord })
        console.log('🚩🚩found exist room', roomId)
      } else {
        roomId = uid()
        socket.emit('existRoomId', { existRoomId: roomId, chatRecord: [] })
        console.log('🐶create new room', roomId)
      }

      socket.join(roomId)
      await setChatRoom({ triggerUser, targetUser, roomId })
    })

    socket.on('joinRoom', async (roomInfo) => {
      const key = JSON.stringify(roomInfo)
      const roomId = await checkRoomExist(key)
      if (!roomId) return
      console.log('join room Id:', roomId)
      const chatRecord = await loadChatRecord(roomId)

      console.log('@@@chatRecord', chatRecord)

      socket.join(roomId)
      socket.emit('checkRoomId', { roomId, chatRecord })
    })

    socket.on('leaveRoom', async (chatRecord) => {
      const { roomId } = chatRecord
      socket.leave(roomId)
      console.log('@@leave Room: ', roomId)
    })

    socket.on('changeRoom', async (roomInfo) => {
      const key = JSON.stringify(roomInfo)
      const roomId = await checkRoomExist(key)
      const chatRecord = await loadChatRecord(roomId as string)
      socket.emit('existRoomId', { existRoomId: roomId, chatRecord })
    })

    socket.on('newMsg', async (msgInfo) => {
      const { roomId, message, createdTime } = msgInfo
      socket.in(roomId).emit('newMsg', { message, createdTime })
      await saveMsgRecord(msgInfo)
      console.log('❤️msg saved ', roomId, message)
    })

    socket.on('disconnect', (reason) => {
      console.log(`Client ${socket.id} disconnected.\nreason: ${reason}`)
    })
  })
}

export {
  chatSocket
}
