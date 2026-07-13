import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const tenants = await prisma.tenant.findMany({
    include: { tenantScore: true },
    orderBy: { createdAt: 'desc' },
    take: 10
  })

  for (const t of tenants) {
    console.log(`Tenant: ${t.name}, Created: ${t.createdAt}, Score: ${t.tenantScore?.totalScore}`)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
