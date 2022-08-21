import express from 'express'
import { upload } from './../../util/multer'
import {
  httpCreatComment
} from './comments.controller'

const commentsRouter = express.Router()

commentsRouter.post('/', upload, httpCreatComment)

export { commentsRouter }
