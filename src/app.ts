import express, { Request, Response } from 'express'
import path from 'path'
// import helmet from 'helmet'
import passport from 'passport'
import cookieSession from 'cookie-session'
import { authRouter, oAuthConfig } from './routers/auth'
import { usersRouter } from './routers/users/users.router'
import { postsRouter } from './routers/posts/posts.router'
import { commentsRouter } from './routers/comments/comments.router'
import { notifRouter } from './routers/notifications/notif.router'
// import multer from 'multer'

import cors from 'cors'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import { authenticateToken } from './util/tokens'
import { redisClient } from './services/redis'

const app = express()

const whitelist = [
  'http://localhost:8080',
  'https://192.168.0.103:8080',
  'https://joeln.site'
]

app.use(
  cors({
    origin: (origin, callback) => {
      if (whitelist.indexOf(origin as string) !== -1 || !origin) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true
  })
)

// app.use(cors({
//   origin: '*'
// }))
// app.use(helmet())
app.use(morgan('dev'))

app.use(
  cookieSession({
    name: 'c-s',
    maxAge: 24 * 60 * 60 * 1000,
    keys: [oAuthConfig.SESSION_KEY1, oAuthConfig.SESSION_KEY2]
  })
)

app.use(passport.initialize())
app.use(passport.session())

app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
// // * parse multi-part form data which is text-only
// app.use(multer().none())
app.use('/test', express.static(path.join(__dirname, '..', 'public')))

app.use('/test2', async (req: Request, res: Response) => {
  res.json({ status: 'test2 success' })
})

app.use('/test3', async (req: Request, res: Response) => {
  await redisClient.set('test1', 'hello')
  res.json({ status: 'success' })
})
app.use('/test4', async (req: Request, res: Response) => {
  const resilt = await redisClient.get('test1')
  res.json({ status: resilt })
})

app.use('/check-env', async (req: Request, res: Response) => {
  res.json({ status: process.env })
})

app.use('/users', usersRouter)
app.use('/posts', authenticateToken, postsRouter)
app.use('/comments', commentsRouter)
app.use('/notifications', notifRouter)
app.use(authRouter)

export = app
