import { Request, Response } from 'express'
import {
  getAttatchComments,
  getComment,
  createComment,
  createLikeComment,
  deleteLikeComment
} from '../../models/comments.model'
import { createNotif, NotifType } from '../../models/notif.model'
import { interactEE } from '../../notificationSocket'
import { addNewFileToS3 } from '../../services/s3'

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
  // TODO: set notif
  console.log('❤️', result)
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
  res.json(result)
}

async function httpGetComment (req: Request, res: Response) {
  const { commentId } = req.params
  const result = await getComment(commentId)
  res.json(result)
}

async function httpGetAttatchComments (req: Request, res: Response) {
  const { commentId } = req.params
  const result = await getAttatchComments(commentId)
  res.json(result)
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
  httpGetComment,
  httpCreatComment,
  httpUpdateLikeComment
}
