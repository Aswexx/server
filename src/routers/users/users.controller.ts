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

  let s3FileKeys: {backgroundImageKey?: string, avatarKey?: string} = {}
  if ((files && files.backgroundImage) || (files && files.avatarImage)) {
    if (!files.backgroundImage) {
      const file = {
        Body: files.avatarImage[0].buffer,
        ContentType: files.avatarImage[0].mimetype
      }
      const avatarKey = await addNewFileToS3(file)
      s3FileKeys.avatarKey = avatarKey
    } else if (!files.avatarImage) {
      const file = {
        Body: files.backgroundImage[0].buffer,
        ContentType: files.backgroundImage[0].mimetype
      }
      const backgroundImageKey = await addNewFileToS3(file)
      s3FileKeys.backgroundImageKey = backgroundImageKey
    } else {
      const imageProps = Object.keys(files)
      const promises = await Promise.all(imageProps.map(async (prop) => {
        const file = {
          Body: files[prop][0].buffer,
          ContentType: files[prop][0].mimetype
        }
        return await addNewFileToS3(file)
      }))

      s3FileKeys = {
        backgroundImageKey: promises[0],
        avatarKey: promises[1]
      }
    }
  }
  console.log('⭕⭕', s3FileKeys)
  const result = await updateUser({
    userId,
    alias: text.alias,
    bio: text.bio,
    fileKeys: {
      backgroundImageKey: s3FileKeys.backgroundImageKey,
      avatarKey: s3FileKeys.avatarKey
    }
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
