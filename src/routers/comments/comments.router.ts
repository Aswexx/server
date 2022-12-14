import express from 'express'
import { upload } from './../../util/multer'
import {
  httpGetAttatchComments,
  httpGetComment,
  httpCreatComment,
  httpUpdateLikeComment
} from './comments.controller'

const commentsRouter = express.Router()

commentsRouter.get('/:commentId/attachComments', httpGetAttatchComments)
commentsRouter.get('/:commentId', httpGetComment)
commentsRouter.post('/', upload, httpCreatComment)
commentsRouter.put('/', httpUpdateLikeComment)

export { commentsRouter }
