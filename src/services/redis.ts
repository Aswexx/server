import { createClient } from 'redis'
import { ChatRecord, PrismaClient } from '@prisma/client'
// import { PrismaClient } from '@prisma/client'
import { getUsersWithId } from '../models/users.model'

// type ChatRecord = {
//   id: string
//   senderId: string
//   contents: string
//   chatTargetId: string
//   createdAt: Date
// }

const prisma = new PrismaClient()

const EXP_TIME = 10 * 60
const EMAIL_VERTIFY_EXP = 15 * 60

const subscriber = createClient({
  url: process.env.REDIS_URL
})
const redisClient = createClient({
  url: process.env.REDIS_URL
});
// const subscriber = createClient({
//   url: 'redis://ec2-user-test-redis-1:6379'
// })
// const redisClient = createClient({
//   url: 'redis://ec2-user-test-redis-1:6379'
// });
// const subscriber = createClient()
// const redisClient = createClient();

(async function connectToRedis () {
  try {
    await redisClient.connect()
    await subscriber.connect()
    await initUsersOnlineState()
    redisClient.configSet('notify-keyspace-events', 'Ex')
    subscriber.subscribe('__keyevent@0__:expired', async (msgKey) => {
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
      await prisma.chatRecord.createMany({
        data: mappedRecordToSave
      })
      await redisClient.del(`temp_${msgKey}`)
    })
  } catch (err) {
    console.error('fail to connect to redis', err)
  }
})()

async function initUsersOnlineState () {
  // TODO: not to do db query if onlinestate exist
  const users = await getUsersWithId()
  users?.forEach((e: {id: string }) => {
    redisClient.hSet('onlineState', e.id, 0)
  })

  console.log('@@initUserWithIds:@@', users)
}

async function setOnlineUserState (userId: string, socketId: string) {
  await redisClient.hSet('onlineState', userId, 1)
  await redisClient.hSet('socketInUse', socketId, userId)
}

async function updateOnlineUserState (socketId: string) {
  const userId = await redisClient.hGet('socketInUse', socketId)
  if (userId) {
    await redisClient.hSet('onlineState', userId, 0)
    await redisClient.hDel('socketInUse', socketId)
    return await redisClient.hGetAll('onlineState')
  }
}

async function getOnlineUserState () {
  return await redisClient.hGetAll('onlineState')
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

async function deleteUserCache (keyPattern: string, userId: string) {
  const regExp = new RegExp(keyPattern, 'i')

  for await (const key of redisClient.scanIterator()) {
    if (regExp.exec(key)) {
      if (key.includes(`recent${keyPattern}:${userId}`) || key.includes(`home${keyPattern}`)) {
        redisClient.del(key)
      }
    }
  }
}

export {
  setOnlineUserState,
  updateOnlineUserState,
  getOnlineUserState,
  setChatRoom,
  saveMsgRecord,
  checkRoomExist,
  loadChatRecord,
  saveEmailVertificationCodeAndTempData,
  compareEmailVertificationCodeThenCreate,
  setCachePersistentChatRecord,
  getCachePersistentChatRecord,
  deleteUserCache,
  redisClient
}
