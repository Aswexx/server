import express from 'express'
import path from 'path'
// import helmet from 'helmet'
import passport from 'passport'
import cookieSession from 'cookie-session'
import { authRouter, oAuthConfig } from './routers/auth'
import { usersRouter } from './routers/users/users.router'
import { postsRouter } from './routers/posts/posts.router'
import { commentsRouter } from './routers/comments/comments.router'
import cors from 'cors'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import { authenticateToken } from './util/tokens'
const app = express()
require('dotenv').config()

const whitelist = [
  'http://localhost:8080'
]

app.use(cors({
  origin: (origin, callback) => {
    console.log('🧨', origin)
    if (whitelist.indexOf(origin as string) !== -1 || !origin) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}))

// app.use(cors({
//   origin: '*'
// }))
// app.use(helmet())
app.use(morgan('dev'))

app.use(cookieSession({
  name: 'c-s',
  maxAge: 24 * 60 * 60 * 1000,
  keys: [oAuthConfig.SESSION_KEY1, oAuthConfig.SESSION_KEY2]
}))

app.use(passport.initialize())
app.use(passport.session())

app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/test', express.static(path.join(__dirname, '..', 'public')))

app.use('/users', usersRouter)
app.use('/posts', authenticateToken, postsRouter)
app.use('/comments', commentsRouter)
app.use(authRouter)

export = app
