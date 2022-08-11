import express from 'express'
import {
  httpGetPosts,
  httpGetUserPosts,
  httpCreatPost,
  httpDeletePost
} from './posts.controller'

const postsRouter = express.Router()

postsRouter.get('/:userId/newestTen', httpGetUserPosts)
postsRouter.delete('/:postId', httpDeletePost)
postsRouter.get('/:skipPostsCount', httpGetPosts)
postsRouter.post('/', httpCreatPost)

export { postsRouter }
