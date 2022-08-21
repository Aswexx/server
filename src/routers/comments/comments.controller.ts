import { Request, Response } from 'express'
import {
  createComment
} from '../../models/comments.model'

async function httpCreatComment (req: Request, res: Response) {
  const newComment = req.body
  const file = req.file

  const result = await createComment(newComment)
  res.json(result)
  // console.log(newComment)
  // console.log(file)
  // res.json({
  //   '😊': '😂',
  //   newComment,
  //   file
  // })
}

export {
  httpCreatComment
}
