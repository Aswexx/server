import express from 'express'
import { httpUpsertUser } from './users.controller'

const usersRouter = express.Router()

usersRouter.post('/', httpUpsertUser)

export { usersRouter }
