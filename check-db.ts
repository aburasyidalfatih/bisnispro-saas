import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function main() {
  const emails = await prisma.emailQueueLog.findMany({
    take: 5,
    orderBy: { sentAt: "desc" }
  })
  console.log("Recent emails:", emails)
  
  const settings = await prisma.platformSetting.findMany({
    where: { key: { contains: "APPROVE" } }
  })
  console.log("Approve settings:", settings)
}

main().catch(console.error).finally(() => prisma.$disconnect())
