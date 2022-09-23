/* eslint-disable no-useless-constructor */
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// interface Comment {
//   authorId: string
//   postId: string
//   commentId?: string
//   contents: string
//   fileKey?: string
//   mediaType?: string
// }

class CommentData {
  constructor (public comment: { [key: string]: string }) { }
  basic = {
    contents: this.comment.contents,
    author: {
      connect: { id: this.comment.authorId }
    },
    onPost: {},
    onComment: {},
    media: {}
  }

  join = {
    author: {
      select: {
        name: true,
        alias: true,
        avatar: {
          select: { url: true }
        }
      }
    },
    // onPost: {
    //   select: { authorId: true }
    // },
    onPost: {},
    onComment: {},
    liked: {
      select: { userId: true }
    }

  }

  setQuery () {
    if (this.comment.commentId) {
      this.basic = { ...this.basic, onComment: { connect: { id: this.comment.commentId } } }
    } else {
      this.basic = { ...this.basic, onPost: { connect: { id: this.comment.postId } } }
    }

    if (this.comment.mediaType) {
      this.basic.media = {
        create: {
          type: this.comment.mediaType,
          url: this.comment.fileKey
        }
      }
    }

    return this.basic
  }

  setJoin () {
    if (this.comment.commentId) {
      this.join.onComment = { select: { authorId: true } }
    } else {
      this.join.onPost = { select: { authorId: true } }
    }

    return this.join
  }
}

async function createComment (comment: { [key: string]: string }) {
  try {
    const commentData = new CommentData(comment)
    const result = await prisma.comment.create({
      data: commentData.setQuery(),
      include: commentData.setJoin()
    })
    prisma.$disconnect()
    return result
  } catch (err) {
    console.log(err)
    prisma.$disconnect()
  }
}

async function getComment (commentId: string) {
  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        author: {
          select: { avatarUrl: true }
        },
        liked: true
      }
    })

    await prisma.$disconnect()
    return comment
  } catch (err) {
    await prisma.$disconnect()
    console.error(err)
  }
}

async function getAttatchComments (commentId: string) {
  try {
    const result = await prisma.comment.findMany({
      where: { onCommentId: commentId },
      include: {
        author: {
          select: {
            name: true,
            alias: true,
            avatarUrl: true
          }
        },
        liked: {
          select: {
            user: { select: { name: true, id: true, alias: true } }
          }
        }
      }
    })
    await prisma.$disconnect()
    return result
  } catch (e) {
    await prisma.$disconnect()
    console.error(e)
  }
}

async function createLikeComment (likeCommentInfo: { [key: string]: string }) {
  try {
    const result = await prisma.likeComment.create({
      data: {
        userId: likeCommentInfo.userId,
        commentId: likeCommentInfo.commentId
      },
      include: {
        comment: {
          include: {
            author: {
              select: { id: true }
            }
          }
        }
      }
    })
    await prisma.$disconnect()
    return result
  } catch (e) {
    await prisma.$disconnect()
    console.error(e)
  }
}

async function deleteLikeComment (likeCommentInfo: { [key: string]: string }) {
  try {
    const result = await prisma.likeComment.deleteMany({
      where: {
        userId: likeCommentInfo.userId,
        commentId: likeCommentInfo.commentId
      }
    })
    await prisma.$disconnect()
    return result
  } catch (e) {
    await prisma.$disconnect()
    console.error(e)
  }
}

export {
  getComment,
  getAttatchComments,
  createComment,
  createLikeComment,
  deleteLikeComment
}
