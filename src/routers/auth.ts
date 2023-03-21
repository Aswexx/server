import express, { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { getUser } from '../models/users.model'
import { authenticateToken } from '../util/tokens'

export const authRouter = express.Router()

authRouter.get('/auth/logout', (req: Request, res: Response, next: NextFunction) => {
  req.logout(
    (err) => {
      if (err) { return next(err) }
    })
  return res.redirect('/')
})

authRouter.get('/auth', authenticateToken, async (req: Request, res: Response) => {
  const acToken = req.cookies.acToken || req.headers.authorization?.split(' ')[1]
  const decoded = jwt.decode(acToken, { complete: true })

  console.log(
    'IP',
    req.ip,
    req.headers['x-forwarded-for']
  )
  // @ts-ignore
  const userId = decoded!.payload.id
  console.log('😅userId', userId)
  const user = await getUser(userId)
  res.json(user)
})
