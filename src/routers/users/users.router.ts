import express from 'express'
// import { setMaxAgeCache } from '../../util/cache-control'
import {
  httpUpsertUser,
  httpGetUser,
  httpGetPopUsers,
  httpAddUserFollowShip,
  httpDeleteUserFollowShip
} from './users.controller'

const usersRouter = express.Router()

usersRouter.get('/popular/:userId', httpGetPopUsers)
usersRouter.get('/:userId', httpGetUser)
usersRouter.post('/normal', httpGetUser)
usersRouter.post('/', httpUpsertUser)
usersRouter.put('/', httpAddUserFollowShip)
usersRouter.delete('/:followShipId', httpDeleteUserFollowShip)

export { usersRouter }
