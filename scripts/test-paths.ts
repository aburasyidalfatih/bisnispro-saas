import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const files = await prisma.fileUpload.findMany({
    where: { NOT: { path: { startsWith: 'https' } } },
    take: 5
  })
  console.log("OLD PATH EXAMPLES:")
  console.log(files.map(f => f.path))
}

main().finally(() => prisma.$disconnect())
