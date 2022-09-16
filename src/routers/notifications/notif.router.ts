import express from 'express'
import { httpCreatNotif } from './notif.controller'

const notifRouter = express.Router()

notifRouter.post('/', httpCreatNotif)

export { notifRouter }
