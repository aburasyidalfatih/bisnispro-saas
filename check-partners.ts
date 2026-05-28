import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()
async function main() {
  const data = await prisma.partnership.findMany({ take: 5 })
  console.log(data)
}
main().catch(console.error).finally(() => prisma.$disconnect())
