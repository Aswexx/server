import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// const getCondition = 'newestTen'

const postSelector = {
  id: true,
  contents: true,
  createdAt: true,
  comments: true,
  liked: true,
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
  userId = '02324dd0-a321-472a-a94e-819cb51341f9'
  const result = prisma.post.findMany({
    where: { authorId: userId },
    select: postSelector,
    orderBy: { createdAt: 'desc' },
    skip,
    take: 10
  })
  console.log(result)

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
