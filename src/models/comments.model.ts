import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

interface Comment {
  authorId: string
  postId: string
  contents: string
  imageUrl?: string
}

async function createComment (comment: Comment) {
  try {
    const result = await prisma.comment.create({
      data: {
        contents: comment.contents,
        author: {
          connect: { id: comment.authorId }
        },
        onPost: {
          connect: { id: comment.postId }
        }
        // image: {
        //   create: { url: comment.imageUrl as string }
        // }
      },
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
