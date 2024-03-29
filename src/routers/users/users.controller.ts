import { Request, Response, Express } from 'express'
import {
  getUser,
  findUniqueUser,
  getUsers,
  getAdmin,
  createUser,
  updateUser,
  // addFollow,
  // deleteFollow,
  getGoogleUser,
  updateSponsor,
  checkLoginInfo
} from '../../models/users.model'
import { addFollow, deleteFollow } from '../../models/followShips.model'
import { createNotif, NotifType } from '../../models/notif.model'
import { sendMail } from '../../services/gmail'
import { hashSync } from '../../util/bcrypt'
import {
  generateTokens,
  generateTokensThenSetCookie
} from '../../util/tokens'
import { interactEE, sponsorPaidEE } from './../../notificationSocket'
import { addNewFileToS3, getFileFromS3 } from '../../services/s3'
import crypto from 'crypto'
import {
  compareEmailVertificationCodeThenCreate,
  redisClient,
  saveEmailVertificationCodeAndTempData
} from '../../services/redis'
import { Mutex } from '../../util/mutex'
import jwt from 'jsonwebtoken'
import { logger } from '../../util/logger'

const getVertificationCode = (numOfChar: number = 4) => {
  let code = ''
  for (let i = 0; i < numOfChar; i++) {
    const randomChar = crypto.randomInt(10)
    code += randomChar
  }

  return code
}

async function httpGetUsers (req: Request, res: Response) {
  const result = await getUsers()
  logger.info('login authenticated', {
    timestamp: new Date(),
    reqIp: req.headers['x-forwarded-for'] || req.ip
  })
  res.json(result)
}

async function waitForEmailVertification (req: Request, res: Response) {
  const userData = req.body
  const vertificationCode = getVertificationCode()
  sendMail(userData.email, vertificationCode)
  await saveEmailVertificationCodeAndTempData(vertificationCode, userData)
  res.json(userData)
}

async function httpEmailVertification (req: Request, res: Response) {
  const { vertifyCode } = req.body
  console.log(vertifyCode)
  const userDataToCreate = await compareEmailVertificationCodeThenCreate(
    vertifyCode
  )
  if (!userDataToCreate) {
    return res.status(400).json('驗證碼錯誤或失效，請重新嘗試註冊')
  }

  userDataToCreate.password = hashSync(userDataToCreate.password)
  await createUser(userDataToCreate)
  res.json({ success: 'ok' })
}

async function httpCreateUser (req: Request, res: Response) {
  const userData = req.body

  const isRegistered = await findUniqueUser({
    email: userData.email,
    name: userData.name,
    alias: userData.alias
  })

  if (isRegistered) return res.status(400).json('已註冊的使用者')

  userData.password = hashSync(userData.password)
  const result = await createUser(userData)

  res.json(result)
}

async function httpAddFollow (req: Request, res: Response) {
  const updateInfo = req.body
  const followship = await addFollow(updateInfo)
  const notif = await createNotif({
    receiverId: followship.followedId,
    informerId: followship.followerId,
    notifType: NotifType.follow
  })

  interactEE.emit('interact', notif)

  res.json(followship)
}

async function httpDeleteFollow (req: Request, res: Response) {
  const { followshipId } = req.params
  const romovedFollowship = await deleteFollow(followshipId)
  res.json(romovedFollowship)
}

async function httpGetNormalLoginUser (req: Request, res: Response) {
  const { account, password, isIOSdevice } = req.body
  if (await checkLoginInfo(account, password)) {
    const user = await getUser(account)

    if (isIOSdevice) {
      const { accessToken } = await generateTokens(user, {
        isIOSdevice: isIOSdevice as boolean,
        reqIp: req.headers['x-forwarded-for'] || req.ip
      })
      res.json({ user, accessToken })
    } else {
      await generateTokensThenSetCookie(user, res)
      res.json(user)
    }
  } else {
    res.json('')
  }
}

async function httpGetUser (req: Request, res: Response) {
  const userId = req.params.userId
  const cacheKey = `userDataKey:${userId}`
  const cacheResult = await redisClient.get(cacheKey)
  const mutex = new Mutex()
  if (cacheResult) {
    return res.json(JSON.parse(cacheResult))
  } else {
    const cacheResult = await mutex.lock(cacheKey)
    if (cacheResult) {
      mutex.releaseLock(cacheKey)
      return res.json(JSON.parse(cacheResult))
    }
  }

  const result = await getUser(userId)
  await redisClient.setEx(cacheKey, 30 * 60, JSON.stringify(result))
  mutex.releaseLock(cacheKey)
  return res.json(result)
}

// async function httpGetUser (req: Request, res: Response) {
//   const { account, password } = req.body
//   const cacheKey = `userDataKey:${account}`
//   const cacheResult = await redisClient.get(cacheKey)
//   const mutex = new Mutex()
//   if (cacheResult) {
//     generateTokensThenSetCookie(cacheResult, res)
//     return res.json(JSON.parse(cacheResult))
//   } else {
//     const cacheResult = await mutex.lock(cacheKey)
//     if (cacheResult) {
//       mutex.releaseLock(cacheKey)
//       generateTokensThenSetCookie(cacheResult, res)
//       return res.json(JSON.parse(cacheResult))
//     }
//   }

//   if (!Object.hasOwn(req.body, 'account')) {
//     const result = await getUser({
//       id: req.params.userId,
//       isLoginUser: false
//     })
//     // * get image from S3 using file key
//     if (result) {
//       if (!/^https/.exec(result.avatarUrl)) {
//         result.avatarUrl = await getFileFromS3(result.avatarUrl)
//       }
//       if (!/^https/.exec(result.bgImageUrl)) {
//         result.bgImageUrl = await getFileFromS3(result.bgImageUrl)
//       }
//     }
//     // ***
//     await redisClient.setEx(cacheKey, 30 * 60, JSON.stringify(result))
//     mutex.releaseLock(cacheKey)
//     return res.json(result)
//   }

//   const result = await getUser({ isLoginUser: true }, { account, password })
//   if (!result) {
//     await redisClient.setEx(cacheKey, 30 * 60, JSON.stringify(result))
//     mutex.releaseLock(cacheKey)
//     return res.json(result)
//   }
//   generateTokensThenSetCookie(result, res)
//   await redisClient.setEx(cacheKey, 30 * 60, JSON.stringify(result))
//   mutex.releaseLock(cacheKey)
//   res.json(result)
// }

async function httpUpdateUser (req: Request, res: Response) {
  const files = req.files as
    | { [fieldname: string]: Express.Multer.File[] }
    | undefined
  const text = req.body
  const { userId } = req.params

  let s3FileKeys: { backgroundImageKey?: string; avatarKey?: string } = {}
  if ((files && files.backgroundImage) || (files && files.avatarImage)) {
    if (!files.backgroundImage) {
      const file = {
        Body: files.avatarImage[0].buffer,
        ContentType: files.avatarImage[0].mimetype
      }
      const avatarKey = await addNewFileToS3(file)
      s3FileKeys.avatarKey = avatarKey
    } else if (!files.avatarImage) {
      const file = {
        Body: files.backgroundImage[0].buffer,
        ContentType: files.backgroundImage[0].mimetype
      }
      const backgroundImageKey = await addNewFileToS3(file)
      s3FileKeys.backgroundImageKey = backgroundImageKey
    } else {
      const imageProps = Object.keys(files)
      const promises = await Promise.all(
        imageProps.map(async (prop) => {
          const file = {
            Body: files[prop][0].buffer,
            ContentType: files[prop][0].mimetype
          }
          return await addNewFileToS3(file)
        })
      )

      s3FileKeys = {
        backgroundImageKey: promises[0],
        avatarKey: promises[1]
      }
    }
  }

  const result = await updateUser({
    userId,
    alias: text.alias,
    bio: text.bio,
    fileKeys: {
      backgroundImageKey: s3FileKeys.backgroundImageKey,
      avatarKey: s3FileKeys.avatarKey
    }
  })
  if (result) {
    result.avatarUrl = await getFileFromS3(result.avatarUrl)
    result.bgImageUrl = await getFileFromS3(result.bgImageUrl)
  }

  res.json(result)
}

async function httpGetGoolgeUser (req: Request, res: Response) {
  const { token, isIOSdevice } = req.body
  const user = await getGoogleUser(token)

  if (isIOSdevice) {
    const { accessToken } = await generateTokens(user, {
      isIOSdevice: isIOSdevice as boolean,
      reqIp: req.headers['x-forwarded-for'] || req.ip
    })
    res.json({ user, accessToken })
  } else {
    await generateTokensThenSetCookie(user, res)
    res.json(user)
  }
}

async function httpGetAdmin (req: Request, res: Response) {
  const { account, password } = req.body
  const result = await getAdmin(account, password)
  if (!result) {
    return res.sendStatus(401)
  }
  await generateTokensThenSetCookie(result, res)
  res.json(result)
}

async function httpUpdateSponsor (req: Request, res: Response) {
  const { userId } = req.body
  const updatedUser = await updateSponsor(userId)
  await redisClient.del(`userData:${updatedUser!.email}`)
  sponsorPaidEE.emit('paid')
  res.redirect('https://joeln.site/#/pay-confirmed')
}

async function httpLogout (req: Request, res: Response) {
  const refreshToken = req.cookies.reToken
  const reqIp = req.headers['x-forwarded-for'] || req.ip
  const decoded = jwt.decode(refreshToken, { complete: true })
  if (decoded) {
    // @ts-ignore
    const userId = decoded.payload.id
    await redisClient.hDel('refreshTokenCollection', userId)
  } else {
    await redisClient.hDel('iosUsersIp', JSON.stringify(reqIp))
  }
  res.json('ok')
}

export {
  waitForEmailVertification,
  httpEmailVertification,
  httpCreateUser,
  httpGetUsers,
  httpGetUser,
  httpGetAdmin,
  httpUpdateUser,
  httpAddFollow,
  httpDeleteFollow,
  httpGetGoolgeUser,
  httpGetNormalLoginUser,
  httpUpdateSponsor,
  httpLogout
}
