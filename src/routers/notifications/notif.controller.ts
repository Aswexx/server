import { Request, Response } from 'express'
import { createNotif } from '../../models/notif.model'
import { interactEE } from '../../notificationSocket'

async function httpCreatNotif (req: Request, res: Response) {
  const result = await createNotif(req.body)
  if (result) {
    interactEE.emit(result.notifType, result)
  }
  res.json(result)
}

export {
  httpCreatNotif
}
