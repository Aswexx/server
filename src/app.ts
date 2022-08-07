import express from 'express'
import path from 'path'
import helmet from 'helmet'
import passport from 'passport'
import cookieSession from 'cookie-session'
import { authRouter, oAuthConfig } from './routers/auth'
import { usersRouter } from './routers/users/users.router'
import cors from 'cors'
const app = express()
require('dotenv').config()

const whitelist = [
  'http://localhost:8080'
]
// middlewares
app.use(cors({
  origin: (origin, callback) => {
    if (whitelist.indexOf(origin as string) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}))

app.use(helmet())
app.use(cookieSession({
  name: 'c-s',
  maxAge: 24 * 60 * 60 * 1000,
  keys: [oAuthConfig.SESSION_KEY1, oAuthConfig.SESSION_KEY2]
}))

app.use(passport.initialize())
app.use(passport.session())

app.use(express.json())
app.use('/test', express.static(path.join(__dirname, '..', 'public')))

app.use('/users', usersRouter)
app.use(authRouter)

export = app
