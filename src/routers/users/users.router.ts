import express from 'express'
import {
  httpUpsertUser,
  httpGetUser,
  httpGetPopUsers
} from './users.controller'

const usersRouter = express.Router()

usersRouter.post('/normal', httpGetUser)
usersRouter.get('/popular', httpGetPopUsers)
usersRouter.post('/', httpUpsertUser)

export { usersRouter }
