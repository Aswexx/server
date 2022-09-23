import { PrismaClient } from '@prisma/client'
import { generateFakeUsersWithPosts } from './seed.user'
const prisma = new PrismaClient()

async function main () {
  await generateFakeUsersWithPosts(15, 20)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
