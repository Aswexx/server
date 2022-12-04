import { Request, Response } from 'express'
import { createNotif, getNotifs } from '../../models/notif.model'
import { interactEE } from '../../notificationSocket'
import { getFileFromS3 } from '../../services/s3'

async function httpGetNotifs (req: Request, res: Response) {
  const { userId } = req.params
  const notifs = await getNotifs(userId)
  if (!notifs) return res.json(null)

  const informerIds = notifs.map(e => e.informerId)
  const uniqueInformerIds = [...new Set(informerIds)]
  const informerIdWithAvatarUrl = await Promise.all(uniqueInformerIds.map(async (id) => {
    const avatarUrlKey = notifs.find((e) => e.informerId === id)!.informer.avatarUrl
    const avatarUrl = /^https/.exec(avatarUrlKey)
      ? avatarUrlKey
      : await getFileFromS3(avatarUrlKey)
    return {
      id,
      avatarUrl
    }
  }))

  const idWithAvatarMap = new Map()
  informerIdWithAvatarUrl.forEach(e => {
    idWithAvatarMap.set(e.id, e.avatarUrl)
  })

  console.log({ idWithAvatarMap })

  const mappedNotifs = notifs!.map(e => {
    return {
      ...e,
      informer: {
        name: e.informer.name,
        avatarUrl: idWithAvatarMap.get(e.informerId)
      }
    }
  })

  res.json(mappedNotifs)
}

async function httpCreatNotif (req: Request, res: Response) {
  console.log('ready to save notif then push', req.body)
  const result = await createNotif(req.body)
  if (result) {
    result.informer.avatarUrl = await getFileFromS3(result.informer.avatarUrl)
    interactEE.emit('interact', result)
    console.log({ result })
  }
  res.json(result)
}

export {
  httpGetNotifs,
  httpCreatNotif
}
