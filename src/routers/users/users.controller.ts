import { Request, Response } from 'express'
import { upsertUser } from '../../models/users.model'

async function httpUpsertUser (req: Request, res: Response) {
  const userData = req.body
  console.log(userData)
  const user = await upsertUser(userData)
  res.json(user)
}

export {
  httpUpsertUser
}
