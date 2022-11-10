import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { redisClient } from '../services/redis'

// const refreshTokenList: string[] = [] // save to Redis
const accessTokenExp: { expiresIn: number | string | undefined } =
  { expiresIn: 0.5 * 60 }

const refreshTokenExp: { expiresIn: number | string | undefined } = {
  expiresIn: 60 * 60
}

async function generateTokensThenSetCookie (userInfo: any, res: Response) {
  if (!process.env.REFRESH_TOKEN_SECRET ||
    !process.env.ACCESS_TOKEN_SECRET) throw new Error('env variable not defined')

  const payload = { id: userInfo.id }
  const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, refreshTokenExp)
  const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, accessTokenExp)

  setCookieWithTokens(refreshToken, accessToken, res)
  // refreshTokenList.push(refreshToken)
  // console.log('🐶🐶', refreshTokenList)
  await redisClient.sAdd('refreshTokenList', refreshToken)
  return { refreshToken, accessToken }
}

function setCookieWithTokens (refreshToken: string, accessToken: string, res: Response) {
  res.cookie('reToken', refreshToken, {
    httpOnly: true,
    secure: true
  })

  res.cookie('acToken', accessToken, {
    httpOnly: true,
    secure: true
  })
}

async function authenticateToken (req: Request, res: Response, next: NextFunction) {
  const acToken = req.cookies.acToken
  const refreshToken = req.cookies.reToken
  if (!acToken) {
    return res.sendStatus(401)
  }
  try {
    jwt.verify(acToken, process.env.ACCESS_TOKEN_SECRET as string)

    next()
  } catch (err) {
    console.log('❌❌', err, 'accessToken not valid or expired')
    const refreshTokenList = await redisClient.sMembers('refreshTokenList')
    console.log('🔑🔑checking refreshTokenList', refreshTokenList)
    // if (!refreshTokenList.includes(refreshToken)) {
    //   console.log('🗺️', 'RefreshToken Not Existed')
    //   return res.sendStatus(401)
    // }
    if (!(await redisClient.sIsMember('refreshTokenList', refreshToken))) {
      console.log('🗺️', 'RefreshToken Not Existed')
      return res.sendStatus(401)
    }
    const newAccessToken = tokenRefresh(refreshToken, res)
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
  // refreshTokenList
  // isAuthenticated
}
