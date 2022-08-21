import express from 'express'
import {
  httpGetPosts,
  httpGetUserPosts,
  httpCreatPost,
  httpDeletePost
} from './posts.controller'

const postsRouter = express.Router()

postsRouter.get('/recent/:userId', httpGetUserPosts)
postsRouter.get('/relative-posts', httpGetPosts)
postsRouter.post('/', httpCreatPost)
postsRouter.delete('/:postId', httpDeletePost)

export { postsRouter }
