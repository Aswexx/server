import express from 'express'
// import { setMaxAgeCache } from '../../util/cache-control'
import {
  httpCreateUser,
  httpGetUser,
  httpGetPopUsers,
  httpGetGoolgeUser,
  httpAddUserFollowShip,
  httpDeleteUserFollowShip
} from './users.controller'

const usersRouter = express.Router()

usersRouter.get('/popular/:userId', httpGetPopUsers)
usersRouter.get('/:userId', httpGetUser)
usersRouter.post('/google', httpGetGoolgeUser)
usersRouter.post('/normal', httpGetUser)
usersRouter.post('/', httpCreateUser)
usersRouter.put('/', httpAddUserFollowShip)
usersRouter.delete('/:followShipId', httpDeleteUserFollowShip)

export { usersRouter }
