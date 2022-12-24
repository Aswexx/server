/* eslint-disable no-unused-vars */
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

interface MentionData {
  mentionedUserId: string
  postId?: string
  commentId?: string
}

async function createMentionsThenGet (mentions: MentionData[]) {
  try {
    console.log('📌📌mentions to create:', mentions)
    await prisma.mention.createMany({
      data: mentions
    })

    return await prisma.mention.findMany()
  } catch (err) {
    console.log(err)
  }
}

export {
  createMentionsThenGet
}
