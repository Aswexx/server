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
    // const query = {
    //   contents: this.comment.contents,
    //   author: {
    //     connect: { id: this.comment.authorId }
    //   },
    //   // onPost: {
    //   //   connect: { id: this.comment.postId }
    //   // },
    //   // onComment: {},
    //   media: {}
    // }

    // if (this.comment.mediaType) {
    //   query.media = {
    //     create: {
    //       type: this.comment.mediaType,
    //       url: this.comment.fileKey
    //     }
    //   }
    // }

    // if (this.comment.commentId) {
    //   query.onComment = {
    //     connect: { id: this.comment.commentId }
    //   }
    // } else {
    //   query.onPost = {
    //     connect: { id: this.comment.postId }
    //   }
    // }
    // return query
  }

  // include()
}

async function createComment (comment: { [key: string]: string }) {
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
        },
        // onPost: {
        //   select: { authorId: true }
        // },
        liked: {
          select: { userId: true }
        }
      }
    })
    prisma.$disconnect()
    return result
  } catch (err) {
    console.log(err)
    prisma.$disconnect()
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
            avatar: { select: { url: true } }
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
  getAttatchComments,
  createComment,
  createLikeComment,
  deleteLikeComment
}
