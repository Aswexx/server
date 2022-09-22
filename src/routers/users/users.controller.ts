import { Request, Response, Express } from 'express'
import {
  // upsertUser,
  getUser,
  createUser,
  updateUser,
  getPopUsers,
  addUserFollowShip,
  deleteUserFollowShip,
  getGoogleUser
} from '../../models/users.model'
import { createNotif, NotifType } from '../../models/notif.model'
// import { sendMail } from '../../services/gmail'
import { hashSync } from '../../util/bcrypt'
import { generateTokens, refreshTokenList } from '../../util/tokens'
import { interactEE } from './../../notificationSocket'
import { addNewFileToS3 } from '../../services/s3'

async function httpCreateUser (req: Request, res: Response) {
  const userData = req.body

  // TODO: validate email availbility
  // TODO: validate unique infos
  userData.password = hashSync(userData.password)
  const result = await createUser(userData)

  res.json(result)
  // res.redirect('http://localhost:8080/#/register')
}

async function httpUpsertUser (req: Request, res: Response) {
  const userData = req.body
  // const user = await upsertUser(userData)
  // sendMail(userData.email)
  console.log('❤️❤️', userData)
  // res.json({ result: 'ok' })
  res.redirect('http://localhost:8080/#/register')
}

async function httpAddUserFollowShip (req: Request, res: Response) {
  const updateInfo = req.body
  const user = await addUserFollowShip(updateInfo)
  const notif = await createNotif({
    receiverId: user.followedId,
    informerId: user.followerId,
    notifType: NotifType.follow
  })

  interactEE.emit('follow', notif)

  res.json(user)
}

async function httpDeleteUserFollowShip (req: Request, res: Response) {
  const { followShipId } = req.params
  const user = await deleteUserFollowShip(followShipId)
  res.json(user)
}

async function httpGetUser (req: Request, res: Response) {
  if (!Object.hasOwn(req.body, 'account')) {
    const result = await getUser({
      id: req.params.userId,
      isLoginUser: false
    })
    return res.json(result)
  }
  const { account, password } = req.body
  const result = await getUser({ isLoginUser: true }, { account, password })
  if (!result) {
    return res.json(result)
  }
  const tokens = generateTokens(result)
  refreshTokenList.push(tokens.refreshToken)
  console.log(refreshTokenList)
  res.cookie('reToken', tokens.refreshToken, {
    httpOnly: true,
    secure: true
  })

  res.cookie('acToken', tokens.accessToken, {
    httpOnly: true,
    secure: true
  })
  res.json(result)
}

async function httpGetPopUsers (req: Request, res: Response) {
  const { userId } = req.params
  const result = await getPopUsers(userId)

  res.json(result)
}

async function httpUpdateUser (req: Request, res: Response) {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined
  const text = req.body
  const { userId } = req.params
  console.log('🚀 ~ file: users.controller.ts ~ line 99 ~ httpUpdateUser ~ userId', userId)

  const fileKeysFromS3: string[] = []
  if ((files && files.backgroundImage) || (files && files.avatarImage)) {
    // * to S3
    console.log('🔗TO S3~~~~~')
    const imgKeys = Object.keys(files)
    await Promise.all(imgKeys.map(async (key) => {
      const file = {
        Body: files[key][0].buffer,
        ContentType: files[key][0].mimetype
      }
      const fileKey = await addNewFileToS3(file)
      fileKeysFromS3.push(fileKey)
    }))
  }
  const result = await updateUser({
    userId,
    alias: text.alias,
    fileKeys: fileKeysFromS3
  })
  res.json(result)
}

async function httpGetGoolgeUser (req: Request, res: Response) {
  const { token } = req.body
  const user = await getGoogleUser(token)
  const tokens = generateTokens(user)

  refreshTokenList.push(tokens.refreshToken)
  console.log(refreshTokenList)
  res.cookie('reToken', tokens.refreshToken, {
    httpOnly: true,
    secure: true
  })

  res.cookie('acToken', tokens.accessToken, {
    httpOnly: true,
    secure: true
  })

  res.json(user)
}

function httpLogout () {
  // TODO: clean token session
  console.log('logout')
}

export {
  httpUpsertUser,
  httpCreateUser,
  httpGetUser,
  httpGetPopUsers,
  httpUpdateUser,
  httpAddUserFollowShip,
  httpDeleteUserFollowShip,
  httpGetGoolgeUser,
  httpLogout
}
