import { Request, Response, Express } from 'express'
import {
  getUser,
  findUniqueUser,
  getUsers,
  getAdmin,
  createUser,
  updateUser,
  // getPopUsers,
  addUserFollowShip,
  deleteUserFollowShip,
  getGoogleUser
} from '../../models/users.model'
import { createNotif, NotifType } from '../../models/notif.model'
// import { sendMail } from '../../services/gmail'
import { hashSync } from '../../util/bcrypt'
import { generateTokensThenSetCookie, refreshTokenList } from '../../util/tokens'
import { interactEE } from './../../notificationSocket'
import { addNewFileToS3, getFileFromS3 } from '../../services/s3'

async function httpGetUsers (req: Request, res: Response) {
  const result = await getUsers()
  res.json(result)
}

async function httpCreateUser (req: Request, res: Response) {
  const userData = req.body

  const isRegistered = await findUniqueUser({
    email: userData.email,
    name: userData.name,
    alias: userData.alias
  })

  if (isRegistered) return res.status(400).json('已註冊的使用者')

  userData.password = hashSync(userData.password)
  const result = await createUser(userData)

  res.json(result)
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
    // * get image from S3 using file key
    if (result) {
      if (!/^https/.exec(result.avatarUrl)) result.avatarUrl = await getFileFromS3(result.avatarUrl)
      if (!/^https/.exec(result.bgImageUrl)) result.bgImageUrl = await getFileFromS3(result.bgImageUrl)
    }
    // ***

    return res.json(result)
  }
  const { account, password } = req.body
  const result = await getUser({ isLoginUser: true }, { account, password })
  if (!result) {
    return res.json(result)
  }
  generateTokensThenSetCookie(result, res)

  res.json(result)
}

// async function httpGetPopUsers (req: Request, res: Response) {
//   const { userId, skip } = req.params
//   const result = await getPopUsers(userId, Number(skip))
//   if (result) {
//     await Promise.all(result.map(async (user) => {
//       if (!/^https/.exec(user.avatarUrl)) {
//         user.avatarUrl = await getFileFromS3(user.avatarUrl)
//       }
//       return user
//     }))
//   }

//   res.json(result)
// }

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
  // TODO: get S3 files url to map the result above before response
  res.json(result)
}

async function httpGetGoolgeUser (req: Request, res: Response) {
  const { token } = req.body
  const user = await getGoogleUser(token)
  generateTokensThenSetCookie(user, res)

  res.json(user)
}

async function httpGetAdmin (req: Request, res: Response) {
  const { account, password } = req.body
  console.log({ account, password })
  const result = await getAdmin({ account, password })
  if (!result) {
    return res.sendStatus(401)
  }

  generateTokensThenSetCookie(result, res)

  res.json(result)
}

function httpLogout (req: Request, res: Response) {
  const refreshToken = req.cookies.reToken
  refreshTokenList.splice(refreshTokenList.indexOf(refreshToken), 1)
  res.json('ok')
}

export {
  httpCreateUser,
  httpGetUsers,
  httpGetUser,
  httpGetAdmin,
  // httpGetPopUsers,
  httpUpdateUser,
  httpAddUserFollowShip,
  httpDeleteUserFollowShip,
  httpGetGoolgeUser,
  httpLogout
}
