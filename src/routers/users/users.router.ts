import express from 'express'
// import { setMaxAgeCache } from '../../util/cache-control'
import {
  httpCreateUser,
  httpGetPopUsers,
  httpGetUser,
  httpGetGoolgeUser,
  httpLogout,
  httpAddUserFollowShip,
  httpDeleteUserFollowShip
} from './users.controller'

const usersRouter = express.Router()

usersRouter.get('/popular/:userId', httpGetPopUsers)
usersRouter.get('/:userId', httpGetUser)
// *includs authenticate refresh token
usersRouter.post('/google', httpGetGoolgeUser)
usersRouter.post('/normal', httpGetUser)
usersRouter.get('/logout', httpLogout)

usersRouter.post('/', httpCreateUser)
usersRouter.put('/', httpAddUserFollowShip)
usersRouter.delete('/:followShipId', httpDeleteUserFollowShip)

export { usersRouter }
