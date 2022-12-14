import { Request, Response } from 'express'
import {
  getPost,
  getPosts,
  getUserPosts,
  createPost,
  createLikePost,
  deleteLikePost,
  deletePost
} from '../../models/posts.model'
import { createNotif, NotifType } from '../../models/notif.model'
import { interactEE } from '../../notificationSocket'
import { addNewFileToS3, getFileFromS3 } from '../../services/s3'

async function httpGetPosts (req: Request, res: Response) {
  const { skipPostsCount } = req.query

  const results = await getPosts('newestTen', Number(skipPostsCount))

  // for (const post of results) {
  //   if (post.comments.length) {
  //     for (const comment of post.comments) {
  //       if (comment.media && comment.media.url) {
  //         const imageKey = comment.media.url
  //         console.log('🧨🧨', imageKey)
  //         comment.media.url = await getFileFromS3(imageKey)
  //       }
  //     }
  //   }
  // }

  // if (!/^https/.exec(post.author.avatarUrl)) {
  //   post.author.avatarUrl = await getFileFromS3(post.author.avatarUrl)
  //   const mapResults = await Promise.all()
  // }

  const mapResults = await Promise.all(results.map(async (post) => {
    if (post.media) {
      post.media.url = await getFileFromS3(post.media.url)
    }

    if (post.comments.length) {
      for (const comment of post.comments) {
        if (comment.media && comment.media.url) {
          comment.media.url = await getFileFromS3(comment.media.url)
        }
      }
    }

    if (!/^https/.exec(post.author.avatarUrl)) {
      post.author.avatarUrl = await getFileFromS3(post.author.avatarUrl)
    }

    return post
  }))

  res.json(mapResults)
}

async function httpGetUserPosts (req: Request, res: Response) {
  const { userId } = req.params

  const result = await getUserPosts(userId)
  res.json(result)
}

async function httpGetPost (req: Request, res: Response) {
  const { postId } = req.params
  const result = await getPost(postId)

  res.json(result)
}

async function httpCreatePost (req: Request, res: Response) {
  const newPost = req.body
  const file = {
    Body: req.file?.buffer,
    ContentType: req.file?.mimetype
  }

  if (req.file) {
    newPost.fileKey = await addNewFileToS3(file)
    newPost.mediaType = file.ContentType
  }

  const result = await createPost(newPost)
  res.json(result)
}

async function httpUpdateLikePost (req: Request, res: Response) {
  const likeInfo = req.body
  let result
  if (likeInfo.isLike) {
    result = await createLikePost(likeInfo)
    if (!result) return
    console.log({ result })

    const notif = await createNotif({
      receiverId: result.post.authorId,
      informerId: result.userId,
      targetPostId: result.postId,
      notifType: NotifType.likePost
    })

    interactEE.emit(NotifType.likePost, notif)
  } else {
    result = await deleteLikePost(likeInfo)
  }

  res.json(result)
}

async function httpDeletePost (req: Request, res: Response) {
  const { postId } = req.params
  const result = await deletePost(postId)

  res.json(result)
}

export {
  httpGetPosts,
  httpGetUserPosts,
  httpGetPost,
  httpCreatePost,
  httpUpdateLikePost,
  httpDeletePost
}
