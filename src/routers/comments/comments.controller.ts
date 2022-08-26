import { Request, Response } from 'express'
import {
  createComment
} from '../../models/comments.model'
import { addNewFileToS3 } from '../../services/s3'

async function httpCreatComment (req: Request, res: Response) {
  const newComment = req.body
  console.log('🔗 ~ file: comments.controller.ts ~ line 9 ~ httpCreatComment ~ newComment', newComment)
  const file = {
    Body: req.file?.buffer,
    ContentType: req.file?.mimetype
  }

  if (req.file) {
    newComment.fileKey = await addNewFileToS3(file)
    newComment.mediaType = file.ContentType
  }
  console.log('😂 ~ file: comments.controller.ts ~ line 16 ~ httpCreatComment ~ newComment', newComment)

  const result = await createComment(newComment)
  res.json(result)
}

export {
  httpCreatComment
}
