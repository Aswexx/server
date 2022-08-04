import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main () {
  const alice = await prisma.user.create({
    data: {
      name: 'alice',
      alias: '222',
      avatar: {
        create: { filename: '22' }
      },
      bgImage: {
        create: { filename: '22' }
      }
    }
  })

  console.log(alice)
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
