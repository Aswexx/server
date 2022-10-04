import express from 'express'
import { upload } from '../../util/multer'
import {
  httpGetPosts,
  httpGetUserPosts,
  httpGetPost,
  httpCreatePost,
  httpUpdateLikePost,
  httpDeletePost
} from './posts.controller'

const postsRouter = express.Router()

postsRouter.get('/recent/:userId', httpGetUserPosts)
postsRouter.get('/home-page', httpGetPosts)
postsRouter.get('/:postId', httpGetPost)
postsRouter.get('/', httpGetPosts)
postsRouter.post('/', upload, httpCreatePost)
postsRouter.put('/', httpUpdateLikePost)
postsRouter.delete('/:postId', httpDeletePost)

export { postsRouter }
