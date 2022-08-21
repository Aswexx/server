import { Request, Response } from 'express'
import {
  getPosts,
  getUserPosts,
  createPost,
  deletePost
} from '../../models/posts.model'

async function httpGetPosts (req: Request, res: Response) {
  const { skipPostsCount } = req.query

  const result = await getPosts('newestTen', Number(skipPostsCount))

  res.json(result)
}

async function httpGetUserPosts (req: Request, res: Response) {
  try {
    const { userId } = req.params

    const result = await getUserPosts(userId)
    res.json(result)
  } catch (e) {
    console.log(e)
  }
}

async function httpCreatPost (req: Request, res: Response) {
  try {
    const { authorId, contents } = req.body
    const result = await createPost(authorId, contents)

    res.json(result)
  } catch (e) {
    console.log(e)
  }
}

async function httpDeletePost (req: Request, res: Response) {
  try {
    const { postId } = req.params
    const result = await deletePost(postId)

    res.json(result)
  } catch (e) {
    console.log(e)
  }
}

export {
  httpGetPosts,
  httpGetUserPosts,
  httpCreatPost,
  httpDeletePost
}
