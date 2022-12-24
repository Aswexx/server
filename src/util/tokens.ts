import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { redisClient } from '../services/redis'

// const refreshTokenCollection: string[] = [] // save to Redis
const accessTokenExp: { expiresIn: number | string | undefined } =
  { expiresIn: 30 * 60 }

// const refreshTokenExp: { expiresIn: number | string | undefined } = {
//   expiresIn: 60 * 60
// }

const REFRESH_TOKEN_COOKIE_EXP = 7 * 24 * 60 * 60 * 1000

async function generateTokensThenSetCookie (userInfo: any, res: Response) {
  if (!process.env.REFRESH_TOKEN_SECRET ||
    !process.env.ACCESS_TOKEN_SECRET) throw new Error('env variable not defined')

  const payload = { id: userInfo.id }
  const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET)
  const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, accessTokenExp)

  setCookieWithTokens(refreshToken, accessToken, res)
  await redisClient.hSet('refreshTokenCollection', userInfo.id, refreshToken)
  return { refreshToken, accessToken }
}

function setCookieWithTokens (refreshToken: string, accessToken: string, res: Response) {
  console.log('setting cookies.........🔑🔑🔑🔑')
  res.cookie('reToken', refreshToken, {
    httpOnly: true,
    // secure: true,
    maxAge: REFRESH_TOKEN_COOKIE_EXP
  })

  res.cookie('acToken', accessToken, {
    httpOnly: true
    // secure: true
  })
}

async function authenticateToken (req: Request, res: Response, next: NextFunction) {
  const acToken = req.cookies.acToken
  const refreshToken = req.cookies.reToken
  const decoded = jwt.decode(acToken, { complete: true })
  let userId
  if (decoded) {
    // @ts-ignore
    userId = decoded.payload.id
  }

  try {
    console.log('acToken & reToken:', acToken, refreshToken)
    jwt.verify(acToken, process.env.ACCESS_TOKEN_SECRET as string)
    next()
  } catch (err) {
    console.log('❌❌', err, 'accessToken not valid or expired')
    const refreshTokenCollection = await redisClient.hGetAll('refreshTokenCollection')
    console.log('🔑🔑checking refreshTokenCollection', refreshTokenCollection)

    if (!refreshToken || !userId) return res.sendStatus(401)
    if (!(await redisClient.hGet('refreshTokenCollection', userId))) {
      console.log('🗺️', 'RefreshToken Not Existed')
      return res.sendStatus(401)
    }
    const newAccessToken = tokenRefresh(refreshToken, res)
    console.log('⭕⭕⭕ newAccessToken generated', newAccessToken)
    res.cookie('acToken', newAccessToken, {
      httpOnly: true,
      secure: true
    })
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
  generateTokensThenSetCookie,
  authenticateToken
  // refreshTokenCollection
  // isAuthenticated
}
