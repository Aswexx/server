import { PrismaClient } from '@prisma/client'
import { generateFakeUsers } from './seed.user'
const prisma = new PrismaClient()

async function main () {
  await generateFakeUsers()
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
