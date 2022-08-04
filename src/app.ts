import { Request, Response } from 'express'
const app = require('express')()
require('dotenv').config()

app.use('/', (_:Request, res: Response) => {
  res.send('hi')
})

export = app
