import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("=== CHECKING TENANT LOGOS ===")
  const totalTenants = await prisma.tenant.count()
  
  const tenantsWithLogo = await prisma.tenant.findMany({
    where: { logo: { not: null, not: "" } },
    select: { id: true, name: true, logo: true }
  })
  
  let r2Count = 0
  let nonR2Logos: string[] = []

  for (const t of tenantsWithLogo) {
    if (t.logo?.startsWith("https://cdn.schoolpro.id/")) {
      r2Count++
    } else {
      nonR2Logos.push(`[${t.name}] ${t.logo}`)
    }
  }

  console.log(`Total Tenants: ${totalTenants}`)
  console.log(`Total Tenants with Logo set: ${tenantsWithLogo.length}`)
  console.log(`Logos using R2 (https://cdn.schoolpro.id/): ${r2Count}`)
  console.log(`Logos NOT using R2: ${nonR2Logos.length}`)
  
  if (nonR2Logos.length > 0) {
    console.log("\nExamples of NON-R2 Logos (up to 10):")
    console.log(nonR2Logos.slice(0, 10).join("\n"))
  }
}

main().finally(() => prisma.$disconnect())
