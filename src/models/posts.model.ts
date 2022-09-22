/* eslint-disable no-useless-constructor */
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const postSelector = {
  id: true,
  contents: true,
  createdAt: true,
  liked: true,
  comments: {
    select: {
      id: true,
      contents: true,
      createdAt: true,
      media: {
        select: { url: true, type: true }
      },
      author: {
        select: {
          name: true,
          alias: true,
          avatar: {
            select: { url: true }
          }
        }
      },
      liked: {
        select: { userId: true }
      }
    }
  },
  author: {
    select: {
      id: true,
      name: true,
      alias: true,
      avatar: {
        select: { url: true }
      }
    }
  }
}

async function getPosts (cond: string, skip: number) {
  const result = await prisma.post.findMany({
    select: {
      id: true,
      contents: true,
      createdAt: true,
      liked: true,
      comments: {
        select: {
          id: true,
          contents: true,
          createdAt: true,
          media: {
            select: { url: true, type: true }
          },
          author: {
            select: {
              name: true,
              alias: true,
              avatar: {
                select: { url: true }
              }
            }
          },
          liked: {
            select: { userId: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      author: {
        select: {
          id: true,
          name: true,
          alias: true,
          avatar: {
            select: { url: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: 10
  })

  return result
}

async function getUserPosts (userId: string, skip: number = 0) {
  const result = prisma.post.findMany({
    where: { authorId: userId },
    select: postSelector,
    orderBy: { createdAt: 'desc' },
    skip,
    take: 10
  })
  return result
}

interface Post {
  authorId: string
  contents: string
  fileKey?: string
  mediaType?: string
}
// TODO: intergate Class PostData and CommentData

class PostData {
  constructor (public post: Post) { }

  setQuery () {
    const query = {
      author: {
        connect: { id: this.post.authorId }
      },
      contents: this.post.contents,
      media: {}
    }

    if (this.post.mediaType) {
      query.media = {
        create: {
          type: this.post.mediaType,
          url: this.post.fileKey
        }
      }
    }

    return query
  }
}

async function getPost (postId: string) {
  try {
    const result = await prisma.post.findFirst({
      where: { id: postId },
      select: postSelector
    })

    await prisma.$disconnect()
    return result
  } catch (e) {
    console.error(e)
    await prisma.$disconnect()
  }
}

async function createPost (newPost: Post) {
  try {
    const result = await prisma.post.create({
      data: new PostData(newPost).setQuery(),
      select: postSelector
    })
    await prisma.$disconnect()
    return result
  } catch (err) {
    console.log(err)
    await prisma.$disconnect()
  }
}

async function createLikePost (info: { [key: string]: string }) {
  try {
    const result = await prisma.likePost.create({
      data: {
        postId: info.postId,
        userId: info.userId
      },
      include: {
        post: {
          select: { authorId: true }
        }
      }
    })
    await prisma.$disconnect()
    return result
  } catch (e) {
    console.error(e)
    await prisma.$disconnect()
  }
}

async function deleteLikePost (info: {[key: string]: string}) {
  try {
    const result = await prisma.likePost.deleteMany({
      where: {
        postId: info.postId,
        userId: info.userId
      }
    })
    await prisma.$disconnect()
    return result
  } catch (e) {
    console.error(e)
    await prisma.$disconnect()
  }
}

async function deletePost (postId: string) {
  try {
    const result = await prisma.post.delete({
      where: { id: postId }
    })
    await prisma.$disconnect()
    return result
  } catch (err) {
    console.error(err)
    await prisma.$disconnect()
  }
}

export {
  getPost,
  getPosts,
  getUserPosts,
  createPost,
  createLikePost,
  deleteLikePost,
  deletePost
}
