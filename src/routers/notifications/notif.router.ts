import express from 'express'
import {
  httpCreatNotif,
  httpGetNotifs,
  httpUpdateNotif
} from './notif.controller'

const notifRouter = express.Router()

notifRouter.get('/:userId', httpGetNotifs)
// notifRouter.post('/mention', httpCreateMentionNotif)
notifRouter.put('/:notifId', httpUpdateNotif)
notifRouter.post('/', httpCreatNotif)

export { notifRouter }
