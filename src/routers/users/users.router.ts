import express from 'express'
import { parseFormDataText, uploadProfileImages } from '../../util/multer'
// import { setMaxAgeCache } from '../../util/cache-control'
import {
  httpCreateUser,
  // httpGetPopUsers,
  httpGetUser,
  httpGetAdmin,
  httpUpdateUser,
  httpGetGoolgeUser,
  httpLogout,
  httpGetUsers,
  httpAddUserFollowShip,
  httpDeleteUserFollowShip
} from './users.controller'

const usersRouter = express.Router()

// usersRouter.get('/popular/:userId/:skip', httpGetPopUsers)
usersRouter.get('/logout', httpLogout)
usersRouter.get('/:userId', httpGetUser)
usersRouter.patch('/:userId', uploadProfileImages, httpUpdateUser)

// *includs authenticate refresh token
usersRouter.post('/google', httpGetGoolgeUser)
usersRouter.post('/normal', httpGetUser)
usersRouter.post('/admin', httpGetAdmin)

usersRouter.get('/', httpGetUsers)
usersRouter.post('/', parseFormDataText, httpCreateUser)
usersRouter.put('/', httpAddUserFollowShip)
usersRouter.delete('/:followShipId', httpDeleteUserFollowShip)

export { usersRouter }
