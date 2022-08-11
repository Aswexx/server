import { Request, Response } from 'express'
import { upsertUser, getUser, getPopUsers } from '../../models/users.model'

async function httpUpsertUser (req: Request, res: Response) {
  const userData = req.body
  const user = await upsertUser(userData)
  res.json(user)
}

async function httpGetUser (req: Request, res: Response) {
  const { account, password } = req.body
  if (account === 'dev123' && password === '123') {
    const result = await getUser({ account, password })
    res.json(result)
  } else {
    res.json('')
  }
}

async function httpGetPopUsers (req: Request, res: Response) {
  const result = await getPopUsers()

  res.json(result)
}

export {
  httpUpsertUser,
  httpGetUser,
  httpGetPopUsers
}
