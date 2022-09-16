import express from 'express'
import { upload } from '../../util/multer'
import {
  httpGetPosts,
  httpGetUserPosts,
  httpGetPost,
  httpCreatPost,
  httpUpdateLikePost,
  httpDeletePost
} from './posts.controller'

const postsRouter = express.Router()

postsRouter.get('/recent/:userId', httpGetUserPosts)
postsRouter.get('/relative-posts', httpGetPosts)
postsRouter.get('/:postId', httpGetPost)
postsRouter.post('/', upload, httpCreatPost)
postsRouter.put('/', httpUpdateLikePost)
postsRouter.delete('/:postId', httpDeletePost)

export { postsRouter }
