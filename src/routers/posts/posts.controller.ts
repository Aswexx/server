import { Request, Response } from 'express'
import {
  getPost,
  getPosts,
  getUserLikePosts,
  getPostsByKeyword,
  getUserPosts,
  getPostsByMostComments,
  getPostsByMostLiked,
  getAllPostsCreatedAt,
  createPost,
  createLikePost,
  deleteLikePost,
  deletePost
} from '../../models/posts.model'
import { createNotif, NotifType } from '../../models/notif.model'
import { interactEE } from '../../notificationSocket'
import { addNewFileToS3, getFileFromS3 } from '../../services/s3'

async function httpGetPosts (req: Request, res: Response) {
  const { skipPostsCount, take, order, keyword } = req.query
  let results

  if (keyword) {
    results = await getPostsByKeyword(keyword as string)
  } else if (!/most/.exec(order as string)) {
    results = await getPosts(Number(skipPostsCount), Number(take), order as string)
  } else if (order === 'mostComments') {
    results = await getPostsByMostComments(Number(skipPostsCount), Number(take))
  } else {
    results = await getPostsByMostLiked(Number(skipPostsCount), Number(take))
  }

  if (!results) {
    return res.json(null)
  }

  const mapResults = await Promise.all(
    results.posts.map(async (post) => {
      if (post.media) {
        post.media.url = await getFileFromS3(post.media.url)
      }

      if (post.comments.length) {
        for (const comment of post.comments) {
          if (comment.media && comment.media.url) {
            comment.media.url = await getFileFromS3(comment.media.url)
          }

          comment.author.avatarUrl = await getFileFromS3(comment.author.avatarUrl)
        }
      }

      if (!/^https/.exec(post.author.avatarUrl)) {
        post.author.avatarUrl = await getFileFromS3(post.author.avatarUrl)
      }

      return post
    })
  )
  res.json({ ...mapResults, postCount: results.postCount })
}

async function httpGetUserPosts (req: Request, res: Response) {
  const { userId } = req.params

  const posts = await getUserPosts(userId)
  // * convert file key to image url if user has any post
  if (posts[0]) {
    if (!/^https/.exec(posts[0].author.avatarUrl)) {
      const userAvatarUrl = await getFileFromS3(posts[0].author.avatarUrl)
      posts.forEach(post => {
        post.author.avatarUrl = userAvatarUrl
      })
    }
  }
  res.json(posts)
}

async function httpGetUserLikePosts (req: Request, res: Response) {
  const { userId } = req.params
  const likes = await getUserLikePosts(userId)

  if (likes) {
    await Promise.all(
      likes.map(async (like) => {
        const key = like.post.author.avatarUrl
        if (!/^https/.exec(key)) {
          like.post.author.avatarUrl = await getFileFromS3(key)
        }
      })
    )
  }

  res.json(likes)
}

async function httpGetPost (req: Request, res: Response) {
  const { postId } = req.params
  const result = await getPost(postId)

  res.json(result)
}

async function httpGetAllPostsCreatedAt (req: Request, res: Response) {
  const result = await getAllPostsCreatedAt()

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

  const post = await createPost(newPost)
  if (post && post.media) {
    post.media.url = await getFileFromS3(post.media.url)
  }

  console.log('@@@@', post)

  res.json(post)
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
  httpGetUserLikePosts,
  httpGetPost,
  httpGetAllPostsCreatedAt,
  httpCreatePost,
  httpUpdateLikePost,
  httpDeletePost
}
