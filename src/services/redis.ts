import { createClient } from 'redis'
import { ChatRecord, PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const EXP_TIME = 10 * 60
const EMAIL_VERTIFY_EXP = 15 * 60

const subscriber = createClient()
const redisClient = createClient();
(async function connectToRedis () {
  try {
    await redisClient.connect()
    await subscriber.connect()
    redisClient.configSet('notify-keyspace-events', 'Ex')
    subscriber.subscribe('__keyevent@0__:expired', async (msgKey) => {
      console.log('@@@⚙️', msgKey)

      const record = await redisClient.lRange(`temp_${msgKey}`, 0, -1)
      const parsedRecord = record.map(r => JSON.parse(r))
      const recordToSave = parsedRecord.filter(r => r.persist)
      const mappedRecordToSave = recordToSave.map(r => {
        return {
          senderId: r.sender,
          contents: r.message,
          chatTargetId: r.reciever,
          createdAt: new Date(r.createdTime)
        }
      })
      console.log('mappedToSave', mappedRecordToSave)
      await prisma.chatRecord.createMany({
        data: mappedRecordToSave
      })
      console.log('recordToDaveToDb', record)
      await redisClient.del(`temp_${msgKey}`)
    })
  } catch (err) {
    console.error('fail to connect to redis', err)
  }
})()

async function setOnlineUser (socketId: string, userId: string) {
  await redisClient.hSet('onlineUsers', socketId, userId)
}

async function getOnlineUsers () {
  return await redisClient.hVals('onlineUsers')
}

async function removeOnlineUser (socketId: string) {
  await redisClient.hDel('onlineUsers', socketId)
}

async function setChatRoom (roomInfo: { triggerUser: string, targetUser: string, roomId: string }) {
  const { triggerUser, targetUser, roomId } = roomInfo
  await redisClient.hSet(
    'chatRooms',
    JSON.stringify({ triggerUser, targetUser }),
    roomId
  )
}

async function checkRoomExist (key: string) {
  const allChatRelations = await redisClient.hKeys('chatRooms')
  const chatters = JSON.parse(key)
  const mappedRelations = allChatRelations.map(r => JSON.parse(r))

  const matchRelation = mappedRelations.find(r => {
    return (
      (r.triggerUser === chatters.triggerUser &&
        r.targetUser === chatters.targetUser) ||
      (r.triggerUser === chatters.targetUser &&
        r.targetUser === chatters.triggerUser)
    )
  }
  )

  if (matchRelation) {
    return await redisClient.hGet('chatRooms', JSON.stringify(matchRelation))
  }

  return undefined
}

async function saveMsgRecord (chatRecord: { roomId: string, message: string, sender: string, reciever: string, createdTime: string, persist: boolean }) {
  const { roomId, message, sender, reciever, createdTime, persist } = chatRecord
  const record = JSON.stringify({
    message,
    sender,
    reciever,
    createdTime,
    persist
  })
  // * update expirition and send notif to api server to save record to DB
  // * list with temp_ is prepare for db saving
  const result = await redisClient.rPush(roomId, record)
  await redisClient.rPush(`temp_${roomId}`, record)
  await redisClient.expire(roomId, EXP_TIME)
  return result
}

async function loadChatRecord (roomId: string) {
  return await redisClient.lRange(roomId, 0, -1)
}

interface TempData {
  email: string
  password: string
  passwordCheck: string
  name: string
  alias: string
}

async function saveEmailVertificationCodeAndTempData (verifyCode: string, tempData: TempData) {
  await redisClient.setEx(verifyCode, EMAIL_VERTIFY_EXP, JSON.stringify(tempData))
}

async function compareEmailVertificationCodeThenCreate (verifyCode: string) {
  const tempData = await redisClient.get(verifyCode)
  if (tempData) {
    await redisClient.del(verifyCode)
    return JSON.parse(tempData)
  }
  return null
}

async function setCachePersistentChatRecord (key: string, chatRecord: ChatRecord[]) {
  await redisClient.setEx(`persistentRecord:${key}`, EXP_TIME, JSON.stringify(chatRecord))
}

async function getCachePersistentChatRecord (key: string) {
  const chatRecord = await redisClient.get(key)
  if (chatRecord) {
    console.log('📌📌', 'getCachePersistentChatRecord!')
    return JSON.parse(chatRecord)
  }
  return null
}

export {
  setOnlineUser,
  removeOnlineUser,
  getOnlineUsers,
  setChatRoom,
  saveMsgRecord,
  checkRoomExist,
  loadChatRecord,
  saveEmailVertificationCodeAndTempData,
  compareEmailVertificationCodeThenCreate,
  setCachePersistentChatRecord,
  getCachePersistentChatRecord,
  redisClient
}
