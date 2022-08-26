/* eslint-disable no-useless-constructor */
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

interface Comment {
  authorId: string
  postId: string
  contents: string
  fileKey?: string
  mediaType?: string
}

class CommentData {
  constructor (public comment: Comment) { }

  setQuery () {
    const query = {
      contents: this.comment.contents,
      author: {
        connect: { id: this.comment.authorId }
      },
      onPost: {
        connect: { id: this.comment.postId }
      },
      media: {}
    }

    if (this.comment.mediaType) {
      query.media = {
        create: {
          type: this.comment.mediaType,
          url: this.comment.fileKey
        }
      }
    }

    return query
  }
}

async function createComment (comment: Comment) {
  try {
    const result = await prisma.comment.create({
      data: new CommentData(comment).setQuery(),
      include: {
        author: {
          select: {
            name: true,
            alias: true,
            avatar: {
              select: { url: true }
            }
          }
        }
      }
    })
    prisma.$disconnect()
    return result
  } catch (err) {
    console.log(err)
    prisma.$disconnect()
    process.exit(1)
  }
}

export {
  createComment
}
