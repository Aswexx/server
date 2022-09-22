import express from 'express'
import {
  httpCreatNotif,
  httpGetNotifs
} from './notif.controller'

const notifRouter = express.Router()

notifRouter.get('/:userId', httpGetNotifs)
notifRouter.post('/', httpCreatNotif)

export { notifRouter }
