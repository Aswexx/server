import express, { Request, Response } from 'express'
import helmet from 'helmet'
import { authRouter } from './routers/auth'
import { usersRouter } from './routers/users/users.router'
import { postsRouter } from './routers/posts/posts.router'
import { commentsRouter } from './routers/comments/comments.router'
import { notifRouter } from './routers/notifications/notif.router'

import cors from 'cors'
import cookieParser from 'cookie-parser'
import { authenticateToken } from './util/tokens'
// import { scheduleJob } from 'node-schedule'
// import { saveLogToS3 } from './services/s3'
// import fs from 'fs'
import morgan from 'morgan'

const app = express()

const whitelist = [
  'https://localhost:8080',
  'https://192.168.0.101:8080',
  'https://192.168.0.103:8080',
  'https://192.168.0.105:8080',
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

app.use(helmet())
// scheduleJob('30 * * * *', async () => {
//   const filesToHandle = [
//     './logs/server.log',
//     './logs/requests.log',
//     './logs/error.log'
//   ]

//   for (const file of filesToHandle) {
//     fs.copyFileSync(file, `${file}-copy`)
//     await saveLogToS3(
//       `${file}-copy`,
//       `${file.replace(/\.\/logs\//, '')}-${new Date()}`
//     )
//     fs.unlinkSync(`${file}-copy`)
//     fs.truncateSync(file, 0)
//   }
// })

// const logStream = fs.createWriteStream('./logs/server.log', { flags: 'a' })
// app.use(
//   morgan('combined', {
//     stream: logStream,
//     skip: (req) => req.originalUrl === '/test2'
//   })
// )
app.use(morgan('dev'))

app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/test2', async (req: Request, res: Response) => {
  res.json({ status: 'test2 success' })
})

app.use('/users', usersRouter)
app.use('/posts', authenticateToken, postsRouter)
app.use('/comments', commentsRouter)
app.use('/notifications', notifRouter)
app.use(authRouter)

export = app
