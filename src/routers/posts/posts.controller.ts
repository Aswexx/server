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
import { createMultiNotifs, createNotif, NotifType } from '../../models/notif.model'
import { interactEE, notificateTagedUsers } from '../../notificationSocket'
import { addNewFileToS3, getFileFromS3 } from '../../services/s3'
import { deleteUserCache, redisClient } from '../../services/redis'
import { Mutex } from '../../util/mutex'
import { findFollowers } from '../../models/followShips.model'

async function httpGetPosts (req: Request, res: Response) {
  const { skipPostsCount, take, order, keyword } = req.query
  const iosAccessToken = req.headers.authorization?.split(' ')[1]
  let results

  const cacheKey = `homePosts:${skipPostsCount}${take}${order}${keyword}`
  const cacheResult = await redisClient.get(cacheKey)
  const mutex = new Mutex()

  if (cacheResult) {
    return res.json(JSON.parse(cacheResult))
  } else {
    const cacheResult = await mutex.lock(cacheKey)
    if (cacheResult) {
      mutex.releaseLock(cacheKey)
      return res.json(JSON.parse(cacheResult))
    }
  }

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
    results.posts.map(async (post: any) => {
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
  await redisClient.setEx(
    cacheKey,
    10 * 60,
    JSON.stringify({ ...mapResults, postCount: results.postCount })
  )
  mutex.releaseLock(cacheKey)
  res.json({ ...mapResults, postCount: results.postCount, iosAccessToken })
}

async function httpGetUserPosts (req: Request, res: Response) {
  const { userId } = req.params

  const cacheKey = `recentPosts:${userId}`
  const cacheResult = await redisClient.get(cacheKey)
  const mutex = new Mutex()

  if (cacheResult) {
    return res.json(JSON.parse(cacheResult))
  } else {
    const cacheResult = await mutex.lock(cacheKey)
    if (cacheResult) {
      mutex.releaseLock(cacheKey)
      return res.json(JSON.parse(cacheResult))
    }
  }

  const posts = await getUserPosts(userId)
  // * convert file key to image url if user has any post
  if (posts[0]) {
    if (!/^https/.exec(posts[0].author.avatarUrl)) {
      const userAvatarUrl = await getFileFromS3(posts[0].author.avatarUrl)
      posts.forEach((post: any) => {
        post.author.avatarUrl = userAvatarUrl
      })
    }

    await Promise.all(
      posts.map(async (post: any) => {
        if (post.media) {
          post.media.url = await getFileFromS3(post.media.url)
        }

        if (post.comments.length) {
          for (const comment of post.comments) {
            if (comment.media && comment.media.url) {
              comment.media.url = await getFileFromS3(comment.media.url)
            }
            comment.author.avatarUrl = await getFileFromS3(
              comment.author.avatarUrl
            )
          }
        }
      })
    )
  }

  await redisClient.setEx(cacheKey, 30 * 60, JSON.stringify(posts))
  mutex.releaseLock(cacheKey)
  res.json(posts)
}

async function httpGetUserLikePosts (req: Request, res: Response) {
  const { userId } = req.params

  const cacheKey = `recentLikePosts:${userId}`
  const cacheResult = await redisClient.get(cacheKey)
  const mutex = new Mutex()

  if (cacheResult) {
    return res.json(JSON.parse(cacheResult))
  } else {
    const cacheResult = await mutex.lock(cacheKey)
    if (cacheResult) {
      mutex.releaseLock(cacheKey)
      return res.json(JSON.parse(cacheResult))
    }
  }

  const likePosts = await getUserLikePosts(userId)

  if (likePosts) {
    await Promise.all(
      likePosts.map(async (like: any) => {
        if (like.post.media) {
          like.post.media.url = await getFileFromS3(like.post.media.url)
        }
        const key = like.post.author.avatarUrl
        if (!/^https/.exec(key)) {
          like.post.author.avatarUrl = await getFileFromS3(key)
        }
      })
    )
  }

  await redisClient.setEx(cacheKey, 30 * 60, JSON.stringify(likePosts))
  mutex.releaseLock(cacheKey)
  res.json(likePosts)
}

async function httpGetPost (req: Request, res: Response) {
  const { postId } = req.params
  const result = await getPost(postId)
  if (result) {
    const avatarUrl = await getFileFromS3(result.author.avatarUrl)
    result.author.avatarUrl = avatarUrl

    if (result.comments.length) {
      await Promise.all(result.comments.map(async (comment: any) => {
        const avatarUrl = await getFileFromS3(comment.author.avatarUrl)
        comment.author.avatarUrl = avatarUrl
        return comment
      }))
    }
  }

  res.json(result)
}

async function httpGetAllPostsCreatedAt (req: Request, res: Response) {
  const { startDate, endDate } = req.body
  const result = await getAllPostsCreatedAt({
    startDate: new Date(startDate),
    endDate: new Date(endDate)
  })

  res.json(result)
}

async function httpCreatePost (req: Request, res: Response) {
  const newPost = req.body
  const parsedTagedUsers = JSON.parse(newPost.tagedUsers)
  const tagedUsers: string[] = Object.values(parsedTagedUsers)

  const file = {
    Body: req.file?.buffer,
    ContentType: req.file?.mimetype
  }

  if (req.file) {
    newPost.fileKey = await addNewFileToS3(file)
    newPost.mediaType = file.ContentType
  }

  const post = await createPost(newPost)
  if (post) {
    if (post.media) {
      post.media.url = await getFileFromS3(post.media.url)
    }

    if (tagedUsers.length) {
      await notificateTagedUsers(post, tagedUsers)
      for (const [alias, userId] of Object.entries(parsedTagedUsers)) {
        const mentionedUserInfo = {
          mentionedUser: { alias },
          mentionedUserId: userId as string
        }
        post.mention.push(mentionedUserInfo)
      }
    }

    const followers: { followerId: string }[] = await findFollowers(post.author.id)

    if (followers.length) {
      const notifsToSave = followers.map(e => {
        return {
          receiverId: e.followerId,
          informerId: post.author.id,
          targetPostId: post.id,
          notifType: NotifType.followNewPost
        }
      })
      const notifs: object[] = await createMultiNotifs(notifsToSave)
      notifs.forEach((notif) => {
        interactEE.emit('interact', notif)
      })
    }
    // * delete redis cache which matches specific pattern
    await deleteUserCache('Posts', post.author.id)
  }
  res.json(post)
}

async function httpUpdateLikePost (req: Request, res: Response) {
  const likeInfo = req.body
  let result
  if (likeInfo.isLike) {
    result = await createLikePost(likeInfo)
    if (!result) return
    if (likeInfo.authorId !== likeInfo.userId) {
      const notif = await createNotif({
        receiverId: result.post.authorId,
        informerId: result.userId,
        targetPostId: result.postId,
        notifType: NotifType.likePost
      })
      interactEE.emit('interact', notif)
    }
  } else {
    result = await deleteLikePost(likeInfo)
  }

  await deleteUserCache('LikePosts', likeInfo.userId)
  await deleteUserCache('Posts', likeInfo.authorId)

  res.json(result)
}

async function httpDeletePost (req: Request, res: Response) {
  const { postId } = req.params
  const post = await deletePost(postId)

  // * delete redis cache matches specific pattern
  if (post) {
    await deleteUserCache('Posts', post.authorId)
  }

  res.json(post)
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
