import { Request, Response } from 'express'
import {
  // upsertUser,
  getUser,
  createUser,
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
  httpAddUserFollowShip,
  httpDeleteUserFollowShip,
  httpGetGoolgeUser,
  httpLogout
}
