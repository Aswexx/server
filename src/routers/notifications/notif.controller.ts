import { Request, Response } from 'express'
import { createNotif, getNotifs } from '../../models/notif.model'
import { interactEE } from '../../notificationSocket'

async function httpGetNotifs (req: Request, res: Response) {
  const { userId } = req.params
  const result = await getNotifs(userId)
  res.json(result)
}

async function httpCreatNotif (req: Request, res: Response) {
  const result = await createNotif(req.body)
  if (result) {
    interactEE.emit(result.notifType, result)
  }
  res.json(result)
}

export {
  httpGetNotifs,
  httpCreatNotif
}
