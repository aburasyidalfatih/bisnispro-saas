import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

async function main() {
  const posts = await db.post.findMany({
    where: {
      type: { startsWith: 'PENGUMUMAN' }
    }
  })
  console.log(posts)
}

main().catch(console.error).finally(() => db.$disconnect())
