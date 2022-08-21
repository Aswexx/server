import { Request, Response } from 'express'
import {
  upsertUser,
  getUser,
  getPopUsers,
  addUserFollowShip,
  deleteUserFollowShip
} from '../../models/users.model'

async function httpUpsertUser (req: Request, res: Response) {
  const userData = req.body
  const user = await upsertUser(userData)
  res.json(user)
}

async function httpAddUserFollowShip (req: Request, res: Response) {
  const updateInfo = req.body
  console.log(updateInfo)
  const user = await addUserFollowShip(updateInfo)
  res.json(user)
}

async function httpDeleteUserFollowShip (req: Request, res: Response) {
  const { followShipId } = req.params
  console.log(followShipId)
  const user = await deleteUserFollowShip(followShipId)
  res.json(user)
}

async function httpGetUser (req: Request, res: Response) {
  if (!Object.hasOwn(req.body, 'account')) {
    console.log('😅😅😅wwwwwwwwwwwwwww')
    const result = await getUser({
      id: req.params.userId,
      isLoginUser: false
    })
    return res.json(result)
  }
  const { account, password } = req.body
  if (account === 'dev123' && password === '123') {
    const result = await getUser({ isLoginUser: true }, { account, password })
    res.json(result)
  } else {
    res.json('')
  }
}

async function httpGetPopUsers (req: Request, res: Response) {
  const { userId } = req.params
  const result = await getPopUsers(userId)

  res.json(result)
}

export {
  httpUpsertUser,
  httpGetUser,
  httpGetPopUsers,
  httpAddUserFollowShip,
  httpDeleteUserFollowShip
}
