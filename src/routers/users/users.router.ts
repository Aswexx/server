import express from 'express'
import { linePay, payCancel, payConfirm } from '../../services/linePay'
import { parseFormDataText, uploadProfileImages } from '../../util/multer'
// import { setMaxAgeCache } from '../../util/cache-control'
import {
  // httpCreateUser,
  waitForEmailVertification,
  httpEmailVertification,
  // httpGetPopUsers,
  httpGetUser,
  httpGetAdmin,
  httpUpdateUser,
  httpGetGoolgeUser,
  httpGetNormalLoginUser,
  httpLogout,
  httpGetUsers,
  httpAddFollow,
  httpDeleteFollow,
  httpUpdateSponsor
} from './users.controller'

const usersRouter = express.Router()

usersRouter.get('/logout', httpLogout)
usersRouter.get('/:userId', httpGetUser)
usersRouter.patch('/:userId', uploadProfileImages, httpUpdateUser)

// *includs authenticate refresh token
usersRouter.post('/google', httpGetGoolgeUser)
usersRouter.post('/normal', httpGetNormalLoginUser)
usersRouter.post('/admin', httpGetAdmin)

usersRouter.get('/', httpGetUsers)
// usersRouter.post('/', parseFormDataText, httpCreateUser)
usersRouter.post('/emailVertification', httpEmailVertification)
usersRouter.post('/', parseFormDataText, waitForEmailVertification)

// * followship
usersRouter.delete('/follow/:followshipId', httpDeleteFollow)
usersRouter.post('/follow', httpAddFollow)

// * sponsor
usersRouter.post('/sponsor', linePay)
usersRouter.get('/sponsor/confirm', payConfirm, httpUpdateSponsor)
usersRouter.post('/sponsor/cancel', payCancel)

export { usersRouter }
