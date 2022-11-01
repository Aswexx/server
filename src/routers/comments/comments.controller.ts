import { Request, Response } from 'express'
import {
  getAttatchComments,
  getComments,
  getComment,
  createComment,
  createLikeComment,
  deleteLikeComment
} from '../../models/comments.model'
import { createNotif, NotifType } from '../../models/notif.model'
import { interactEE } from '../../notificationSocket'
import { redisClient } from '../../services/redis'
import { addNewFileToS3, getFileFromS3 } from '../../services/s3'
import { Mutex } from '../../util/mutex'

async function httpCreatComment (req: Request, res: Response) {
  const newComment = req.body
  console.log({ newComment })
  const file = {
    Body: req.file?.buffer,
    ContentType: req.file?.mimetype
  }

  if (req.file) {
    newComment.fileKey = await addNewFileToS3(file)
    newComment.mediaType = file.ContentType
  }

  const result = await createComment(newComment)
  if (result && result.onPost && result.postId) {
    const notif = await createNotif({
      receiverId: result.onPost.authorId,
      informerId: result.authorId,
      targetPostId: result.postId,
      notifType: NotifType.replyPost
    })
    interactEE.emit(NotifType.replyPost, notif)
  } else if (result && result.onComment && result.onCommentId) {
    const notif = await createNotif({
      receiverId: result.onComment.authorId,
      informerId: result.authorId,
      targetCommentId: result.onCommentId,
      notifType: NotifType.replyComment
    })
    interactEE.emit(NotifType.replyComment, notif)
  }

  if (result && result.media) {
    result.media.url = await getFileFromS3(result.media.url)
  }
  res.json(result)
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
      interactEE.emit(NotifType.likeComment, notif)
    }
  } else {
    result = await deleteLikeComment(likeCommentInfo)
  }

  res.json(result)
}

export {
  httpGetAttatchComments,
  httpGetUserComments,
  httpGetComment,
  httpCreatComment,
  httpUpdateLikeComment
}
