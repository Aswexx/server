import express from 'express'
import helmet from 'helmet'
import passport from 'passport'
import cookieSession from 'cookie-session'
import { authRouter, oAuthConfig } from './routers/auth'
const app = express()
require('dotenv').config()

// middlewares
app.use(helmet())
app.use(cookieSession({
  name: 'c-s',
  maxAge: 24 * 60 * 60 * 1000,
  keys: [oAuthConfig.SESSION_KEY1, oAuthConfig.SESSION_KEY2]
}))

app.use(passport.initialize())
app.use(passport.session())

app.use(authRouter)

export = app
