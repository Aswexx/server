import express from 'express'
import { upload } from '../../util/multer'
import {
  httpGetPosts,
  httpGetUserLikePosts,
  httpGetUserPosts,
  httpGetPost,
  httpGetAllPostsCreatedAt,
  httpCreatePost,
  httpUpdateLikePost,
  httpDeletePost
} from './posts.controller'

const postsRouter = express.Router()

postsRouter.get('/recent/:userId', httpGetUserPosts)
postsRouter.get('/likes/:userId', httpGetUserLikePosts)
postsRouter.get('/home-page', httpGetPosts)
postsRouter.get('/createdTime', httpGetAllPostsCreatedAt)
postsRouter.get('/:postId', httpGetPost)
postsRouter.get('/', httpGetPosts)
postsRouter.post('/', upload, httpCreatePost)
postsRouter.put('/', httpUpdateLikePost)
postsRouter.delete('/:postId', httpDeletePost)

export { postsRouter }
