import { Request, Response } from 'express'
import {
  getAttatchComments,
  getComments,
  getComment,
  createComment,
  createLikeComment,
  deleteLikeComment,
  deleteComment
} from '../../models/comments.model'
import { createNotif, NotifType } from '../../models/notif.model'
import { interactEE, notificateTagedUsers } from '../../notificationSocket'
import { deleteUserCache, redisClient } from '../../services/redis'
import { addNewFileToS3, getFileFromS3 } from '../../services/s3'
import { Mutex } from '../../util/mutex'

async function httpCreatComment (req: Request, res: Response) {
  const newComment = req.body
  let parsedTagedUsers = {}
  if (newComment.tagedUsers) {
    parsedTagedUsers = JSON.parse(newComment.tagedUsers)
  }
  const tagedUsers: string[] = Object.values(parsedTagedUsers)

  const file = {
    Body: req.file?.buffer,
    ContentType: req.file?.mimetype
  }

  if (req.file) {
    newComment.fileKey = await addNewFileToS3(file)
    newComment.mediaType = file.ContentType
  }

  const comment = await createComment(newComment)

  if (comment) {
    if (comment.onPost && comment.postId) {
      const notif = await createNotif({
        receiverId: comment.onPost.authorId,
        informerId: comment.authorId,
        targetPostId: comment.postId,
        notifType: NotifType.replyPost
      })
      interactEE.emit('interact', notif)
    } else if (comment.onComment && comment.onCommentId) {
      const notif = await createNotif({
        receiverId: comment.onComment.authorId,
        informerId: comment.authorId,
        targetCommentId: comment.onCommentId,
        notifType: NotifType.replyComment
      })
      interactEE.emit('interact', notif)
    }

    if (comment.media) {
      comment.media.url = await getFileFromS3(comment.media.url)
    }

    if (tagedUsers.length) {
      await notificateTagedUsers(comment, tagedUsers)
    }

    await deleteUserCache('Comments', comment.authorId)
  }

  res.json(comment)
}

async function httpGetUserComments (req: Request, res: Response) {
  const { userId } = req.params

  const cacheKey = `recentComments:${userId}`
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

  const comments = await getComments(userId)
  if (comments && comments.length) {
    const avatarUrl = await getFileFromS3(comments[0].author.avatarUrl)
    comments.forEach((comment) => {
      comment.author.avatarUrl = avatarUrl
    })
  }

  await redisClient.setEx(cacheKey, 30 * 60, JSON.stringify(comments))
  mutex.releaseLock(cacheKey)
  res.json(comments)
}

async function httpGetComment (req: Request, res: Response) {
  const { commentId } = req.params
  const result = await getComment(commentId)
  if (result) {
    const avatarUrl = await getFileFromS3(result.author.avatarUrl)
    result.author.avatarUrl = avatarUrl
  }
  res.json(result)
}

async function httpGetAttatchComments (req: Request, res: Response) {
  const { commentId } = req.params
  const comments = await getAttatchComments(commentId)

  if (comments) {
    await Promise.all(
      comments.map(async (comment) => {
        const fileKey = comment.author.avatarUrl
        if (!/^https/.exec(fileKey)) {
          const avatarUrl = await getFileFromS3(fileKey)
          comment.author.avatarUrl = avatarUrl
        }

        return comment
      })
    )
  }
  res.json(comments)
}

async function httpUpdateLikeComment (req: Request, res: Response) {
  const likeCommentInfo = req.body
  let result
  if (likeCommentInfo.isLike) {
    result = await createLikeComment(likeCommentInfo)
    if (result) {
      const notif = await createNotif({
        receiverId: result.comment.author.id,
        informerId: result.userId,
        targetCommentId: result.commentId,
        notifType: NotifType.likeComment
      })
      interactEE.emit('interact', notif)
    }
  } else {
    result = await deleteLikeComment(likeCommentInfo)
  }

  res.json(result)
}

async function httpDeleteComment (req: Request, res: Response) {
  const { commentId } = req.params

  const comment = await deleteComment(commentId)
  if (comment) {
    await deleteUserCache('Comments', comment.authorId)
  }

  res.json(comment)
}

export {
  httpGetAttatchComments,
  httpGetUserComments,
  httpGetComment,
  httpCreatComment,
  httpUpdateLikeComment,
  httpDeleteComment
}
