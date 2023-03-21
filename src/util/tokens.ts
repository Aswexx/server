import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { redisClient } from '../services/redis'

const accessTokenExp: { expiresIn: number | string | undefined } =
  { expiresIn: 15 * 60 }

const REFRESH_TOKEN_COOKIE_EXP = 7 * 24 * 60 * 60 * 1000
const ACCESS_TOKEN_COOKIE_EXP = 15 * 60 * 1000

interface DeviceInfo {
  isIOSdevice: boolean
  reqIp: string | string[] | undefined
}

async function generateTokens (userInfo: any, deviceInfo?: DeviceInfo) {
  if (!process.env.REFRESH_TOKEN_SECRET || !process.env.ACCESS_TOKEN_SECRET) {
    throw new Error('env variable not defined')
  }

  const payload: { id: string; isIOSdevice?: boolean } = {
    id: userInfo.id
  }
  const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET)
  let accessToken = jwt.sign(
    payload,
    process.env.ACCESS_TOKEN_SECRET,
    accessTokenExp
  )

  if (deviceInfo) {
    payload.isIOSdevice = true
    accessToken = jwt.sign(
      payload,
      process.env.ACCESS_TOKEN_SECRET,
      accessTokenExp
    )

    console.log('regenTTTTTT', JSON.stringify(deviceInfo.reqIp), userInfo.id)

    await redisClient.hSet('iosUsersIp', JSON.stringify(deviceInfo.reqIp), userInfo.id)
  }

  await redisClient.hSet('refreshTokenCollection', userInfo.id, refreshToken)
  return { refreshToken, accessToken }
}

async function generateTokensThenSetCookie (userInfo: any, res: Response) {
  const { refreshToken, accessToken } = await generateTokens(userInfo)

  setCookieWithTokens(refreshToken, accessToken, res)
  await redisClient.hSet('refreshTokenCollection', userInfo.id, refreshToken)
  return { refreshToken, accessToken }
}

function setCookieWithTokens (refreshToken: string, accessToken: string, res: Response) {
  console.log('setting cookies.........🔑🔑🔑🔑')
  res.cookie('reToken', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: REFRESH_TOKEN_COOKIE_EXP
  })

  res.cookie('acToken', accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: ACCESS_TOKEN_COOKIE_EXP
  })
}

async function authenticateToken (req: Request, res: Response, next: NextFunction) {
  const acToken = req.cookies.acToken || req.headers.authorization?.split(' ')[1]
  const refreshToken = req.cookies.reToken
  const reqIp = req.headers['x-forwarded-for'] || req.ip

  console.log(
    '@@@@acToken',
    'cookie-acToken',
    req.cookies.acToken,
    'header-token',
    req.headers.authorization?.split(' ')[1]
  )

  const decoded = jwt.decode(acToken, { complete: true })
  let userId
  let isIOSdevice
  if (decoded) {
    // @ts-ignore
    userId = decoded.payload.id
    // @ts-ignore
    isIOSdevice = decoded.payload.isIOSdevice
  }

  try {
    jwt.verify(acToken, process.env.ACCESS_TOKEN_SECRET as string)
    next()
  } catch (err) {
    const loginedUserId = await redisClient.hGet(
      'iosUsersIp',
      JSON.stringify(reqIp)
    )
    console.log('acToken not valid', isIOSdevice, loginedUserId)

    // * In order to ensure automatic refreshing of the accessToken for iOS users
    // * when revisiting the website, the alternative process will only be executed
    // * when it cannot be confirmed that the current request is coming from an iOS
    // * device and the login IP for iOS has not been previously recorded in Redis."

    if (!isIOSdevice && !loginedUserId) {
      console.log('❌❌', err, 'accessToken not valid or expired')

      if (!refreshToken || !userId) return res.sendStatus(401)
      if (!(await redisClient.hGet('refreshTokenCollection', userId))) {
        console.log('🗺️', 'RefreshToken Not Existed')
        return res.sendStatus(401)
      }
      const newAccessToken = tokenRefresh(refreshToken, res)
      console.log('⭕⭕⭕ newAccessToken generated', newAccessToken)
      res.cookie('acToken', newAccessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
      })
      return next()
    }
    // * IOS device
    console.log('🔑🔑checking IOS ip....')
    if (!loginedUserId) {
      return res.sendStatus(401)
    }

    const { accessToken } = await generateTokens(
      { id: loginedUserId },
      { isIOSdevice: true, reqIp }
    )
    req.headers.authorization = `Bearer ${accessToken}`
    console.log('new req acToken', accessToken)
    next()
  }
}

function tokenRefresh (refreshToken: string, res: Response) {
  try {
    console.log('start to refresh token......')
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET as string)
    const decoded = jwt.decode(refreshToken, { json: true })
    if (decoded) {
      decoded.iat = 0 //* reset initial timestamp
      return jwt.sign(decoded, process.env.ACCESS_TOKEN_SECRET as string, accessTokenExp)
    }
  } catch (err) {
    console.error(err)
    return res.sendStatus(401)
  }
}

export {
  generateTokens,
  generateTokensThenSetCookie,
  authenticateToken
}
