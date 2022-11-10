import { Server } from 'socket.io'
import {
  setChatRoom,
  checkRoomExist,
  saveMsgRecord,
  loadChatRecord,
  getCachePersistentChatRecord,
  setCachePersistentChatRecord
} from './services/redis'
import crypto from 'crypto'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const uid = () => crypto.randomBytes(8).toString('hex')

async function getPersistentChatRecord (triggerUser: string, targetUser: string) {
  const key = `${triggerUser}${targetUser}`
  const cacheChatRecord = await getCachePersistentChatRecord(key)
  if (cacheChatRecord) return cacheChatRecord
  const persistentChatRecord = await prisma.chatRecord.findMany({
    where: {
      OR: [
        { senderId: triggerUser, chatTargetId: targetUser },
        { senderId: targetUser, chatTargetId: triggerUser }
      ]
    },
    orderBy: { createdAt: 'asc' }
  })
  if (persistentChatRecord.length) {
    await setCachePersistentChatRecord(key, persistentChatRecord)
  }

  return persistentChatRecord
}

function chatSocket (io: Server) {
  const chat = io.of('/chat')
  chat.on('connection', (socket) => {
    console.log(`a user connect to chat socket. id: ${socket.id}`)

    socket.on('startChat', async (roomInfo) => {
      const { triggerUser, targetUser, isTriggerUserSponsor } = roomInfo
      let persistentChatRecord
      console.log(triggerUser, targetUser, isTriggerUserSponsor)
      // * if triggerUser is sponsor then try to get persistent chat record first
      if (isTriggerUserSponsor) {
        persistentChatRecord = await getPersistentChatRecord(triggerUser, targetUser)
      }

      // * check is chat room exist or using new unique roomId then load chat record
      const key = JSON.stringify({ triggerUser, targetUser })
      const existRoomId = await checkRoomExist(key)
      let roomId
      let mappedPersistentChatRecord
      if (persistentChatRecord) {
        mappedPersistentChatRecord = persistentChatRecord.map(
          (e: object) => JSON.stringify(e)
        )
      }

      if (existRoomId) {
        roomId = existRoomId
        let chatRecord = await loadChatRecord(existRoomId)
        if (mappedPersistentChatRecord) {
          chatRecord = [...mappedPersistentChatRecord, ...chatRecord]
        }
        socket.emit('existRoomId', { existRoomId, chatRecord })
      } else {
        roomId = uid()
        socket.emit('existRoomId', { existRoomId: roomId, chatRecord: mappedPersistentChatRecord || [] })
      }

      socket.join(roomId)
      await setChatRoom({ triggerUser, targetUser, roomId })
    })

    socket.on('joinRoom', async (roomInfo) => {
      const { triggerUser, targetUser, isTargetUserSponsor } = roomInfo
      const key = JSON.stringify({ triggerUser, targetUser })
      let persistentChatRecord
      const roomId = await checkRoomExist(key)
      if (!roomId) return
      console.log('join room Id:', roomId, isTargetUserSponsor)
      // * if reciever is sponsor then try to get persistent chat record first
      if (isTargetUserSponsor) {
        persistentChatRecord = await getPersistentChatRecord(triggerUser, targetUser)
      }
      // ******

      let mappedPersistentChatRecord
      let chatRecord = await loadChatRecord(roomId)
      if (persistentChatRecord) {
        mappedPersistentChatRecord = persistentChatRecord.map((e: object) =>
          JSON.stringify(e)
        )
        chatRecord = [...mappedPersistentChatRecord, ...chatRecord]
      }

      socket.join(roomId)
      socket.emit('checkRoomId', { roomId, chatRecord })
    })

    socket.on('leaveRoom', async (chatRecord) => {
      const { roomId } = chatRecord
      socket.leave(roomId)
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
    })

    socket.on('disconnect', (reason) => {
      console.log(`Client ${socket.id} disconnected.\nreason: ${reason}`)
    })
  })
}

export {
  chatSocket
}
