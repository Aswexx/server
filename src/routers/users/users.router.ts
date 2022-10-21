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
  httpAddFollow,
  httpDeleteFollow
} from './users.controller'

const usersRouter = express.Router()

usersRouter.get('/logout', httpLogout)
usersRouter.get('/:userId', httpGetUser)
usersRouter.patch('/:userId', uploadProfileImages, httpUpdateUser)

// *includs authenticate refresh token
usersRouter.post('/google', httpGetGoolgeUser)
usersRouter.post('/normal', httpGetUser)
usersRouter.post('/admin', httpGetAdmin)

usersRouter.get('/', httpGetUsers)
usersRouter.post('/', parseFormDataText, httpCreateUser)

// * followship
usersRouter.delete('/follow/:followshipId', httpDeleteFollow)
usersRouter.post('/follow', httpAddFollow)

export { usersRouter }
