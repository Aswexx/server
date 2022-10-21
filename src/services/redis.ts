import { createClient } from 'redis'

const EXP_TIME = 10 * 60

const subscriber = createClient()
const redisClient = createClient();
// let onlineUsers: string[]
(async function connectToRedis () {
  try {
    await redisClient.connect()
    await subscriber.connect()
    redisClient.configSet('notify-keyspace-events', 'Ex')
    subscriber.subscribe('__keyevent@0__:expired', async (msgKey) => {
      console.log('@@@⚙️', msgKey)

      const record = await redisClient.lRange(`temp_${msgKey}`, 0, -1)
      // *TODO: save to DB
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
  // await redisClient.hSet('chatRooms', triggerUser, roomId)
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
  console.log('chatters😂😂', chatters, mappedRelations)

  const matchRelation = mappedRelations.find(r => {
    return (
      (r.triggerUser === chatters.triggerUser &&
        r.targetUser === chatters.targetUser) ||
      (r.triggerUser === chatters.targetUser &&
        r.targetUser === chatters.triggerUser)
    )
  }
  )
  console.log({ matchRelation })

  if (matchRelation) {
    console.log('🔗🔗🔗🔗matchRelation', matchRelation)
    return await redisClient.hGet('chatRooms', JSON.stringify(matchRelation))
  }

  return undefined
}

async function saveMsgRecord (chatRecord: { roomId: string, message: string, sender: string, reciever: string, createdTime: string }) {
  const { roomId, message, sender, reciever, createdTime } = chatRecord
  const record = JSON.stringify({ message, sender, reciever, createdTime })
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
export {
  setOnlineUser,
  removeOnlineUser,
  getOnlineUsers,
  setChatRoom,
  saveMsgRecord,
  checkRoomExist,
  loadChatRecord
}
