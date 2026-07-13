import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function main() {
  const settings = await prisma.platformSetting.findMany({
    where: { key: { contains: "SMTP" } }
  })
  console.log("SMTP settings:", settings)
}

main().catch(console.error).finally(() => prisma.$disconnect())
