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
    select: postSelector,
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
    process.exit(1)
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
    console.log(err)
    await prisma.$disconnect()
    process.exit(1)
  }
}

export {
  getPosts,
  getUserPosts,
  createPost,
  deletePost
}
