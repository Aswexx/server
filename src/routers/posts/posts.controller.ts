import { Request, Response } from 'express'
import {
  getPosts,
  getUserPosts,
  createPost,
  deletePost
} from '../../models/posts.model'
import { addNewFileToS3, getFileFromS3 } from '../../services/s3'

async function httpGetPosts (req: Request, res: Response) {
  const { skipPostsCount } = req.query

  const results = await getPosts('newestTen', Number(skipPostsCount))

  for (const post of results) {
    if (post.comments) {
      for (const comment of post.comments) {
        if (comment.media && comment.media.url) {
          const imageKey = comment.media.url
          console.log('🧨🧨', imageKey)
          comment.media.url = await getFileFromS3(imageKey)
        }
      }
    }
  }

  res.json(results)
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
    const newPost = req.body
    const file = {
      Body: req.file?.buffer,
      ContentType: req.file?.mimetype
    }

    if (req.file) {
      newPost.fileKey = await addNewFileToS3(file)
      newPost.mediaType = file.ContentType
    }
    console.log('🚀 ~ file: posts.controller.ts ~ line 52 ~ httpCreatPost ~ newPost', newPost)

    const result = await createPost(newPost)

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
