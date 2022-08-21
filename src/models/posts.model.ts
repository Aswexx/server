import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// const getCondition = 'newestTen'

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
      imageUrl: true,
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

async function createPost (authorId: string, contents: string) {
  try {
    const result = await prisma.post.create({
      data: {
        authorId,
        contents
      },
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
