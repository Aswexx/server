import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

const refreshTokenList: string[] = [] // save to Redis
const accessTokenExp: { expiresIn: number | string | undefined } =
  { expiresIn: 15 }

function generateTokens (userInfo: any) {
  if (!process.env.REFRESH_TOKEN_SECRET ||
    !process.env.ACCESS_TOKEN_SECRET) throw new Error('env variable not defined')

  const payload = { id: userInfo.id }
  const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET)
  const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, accessTokenExp)

  return { refreshToken, accessToken }
}

// function isAuthenticated (req: Request, res: Response, next: NextFunction): void {
//   // TODO: intergrate google and normal login
//   const isGoogleLoggedIn = req.isAuthenticated() && req.user
//   const isNormalLoggedIn = req.cookies.acToken && req.cookies.reToken

//   if (!isGoogleLoggedIn && !isNormalLoggedIn) {
//     console.log('user not logged in')
//     res.sendStatus(401)
//     return
//   }
//   console.log('user logged checked')
//   console.log(req.user)

//   next()
// }

function authenticateToken (req: Request, res: Response, next: NextFunction) {
  const acToken = req.cookies.acToken
  const refreshToken = req.cookies.reToken
  if (!acToken) {
    return res.sendStatus(401)
  }
  try {
    jwt.verify(acToken, process.env.ACCESS_TOKEN_SECRET as string)

    next()
  } catch (err) {
    console.log('ββ', err)
    console.log(refreshTokenList)
    if (!refreshTokenList.includes(refreshToken)) {
      console.log('πΊοΈ', 'Not Existed')
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
    console.log('start exchanging......')
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET as string)
    const decoded = jwt.decode(refreshToken, { json: true })
    if (decoded) {
      decoded.iat = 0 //* reset initial timestamp
      return jwt.sign(decoded, process.env.ACCESS_TOKEN_SECRET as string, accessTokenExp)
    }
  } catch (err) {
    console.log(err)
    return res.status(401)
  }
}

export {
  generateTokens,
  authenticateToken,
  refreshTokenList
  // isAuthenticated
}
