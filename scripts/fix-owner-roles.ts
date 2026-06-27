import { PrismaClient } from "@prisma/client"
const db = new PrismaClient()

async function run() {
  const tenants = await db.tenant.findMany({
    include: {
      users: true
    }
  })

  let fixed = 0
  for (const tenant of tenants) {
    const owners = tenant.users.filter(u => u.role === "owner")
    if (owners.length === 0) {
      console.log(`Tenant ${tenant.slug} has NO owner!`)
      // check if any user matches the tenant email
      let ownerUser = null
      if (tenant.email) {
        const emailUser = await db.user.findUnique({ where: { email: tenant.email.toLowerCase() } })
        if (emailUser) {
           ownerUser = tenant.users.find(u => u.userId === emailUser.id)
        }
      }

      if (!ownerUser) {
         // just take the oldest TenantUser record
         ownerUser = tenant.users.sort((a, b) => a.id.localeCompare(b.id))[0]
      }

      if (ownerUser) {
        console.log(`Restoring user ${ownerUser.userId} as owner for ${tenant.slug}...`)
        await db.tenantUser.update({
          where: { id: ownerUser.id },
          data: { role: "owner" }
        })
        fixed++
      }
    }
  }
  console.log(`Fixed ${fixed} tenants`)
}

run().catch(console.error).finally(() => process.exit(0))
