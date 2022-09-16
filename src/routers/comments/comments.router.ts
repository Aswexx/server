import express from 'express'
import { upload } from './../../util/multer'
import {
  httpGetAttatchComments,
  httpCreatComment,
  httpUpdateLikeComment
} from './comments.controller'

const commentsRouter = express.Router()

commentsRouter.get('/:commentId', httpGetAttatchComments)
commentsRouter.post('/', upload, httpCreatComment)
commentsRouter.put('/', httpUpdateLikeComment)

export { commentsRouter }
