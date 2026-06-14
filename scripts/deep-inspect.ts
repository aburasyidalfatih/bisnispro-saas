import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("=== CHECKING FOR LINGERING LOCAL URLS ===")
  const searchStrings = ["/api/files/", "uploads/"]

  for (const searchStr of searchStrings) {
    console.log(`\n--- Searching for '${searchStr}' ---`)

    // Post content (HTML)
    const postsWithLocalImg = await prisma.post.findMany({
      where: { content: { contains: searchStr } },
      select: { id: true }
    })
    console.log(`Posts with '${searchStr}' in content:`, postsWithLocalImg.length)

    // Tenant JSON fields (Can't use contains easily on JSON in all Prisma versions, let's fetch and filter in JS if needed, but let's try raw query for JSON text)
  }

  // Raw query to check JSON fields and other strings across the DB
  const rawQueries = [
    `SELECT COUNT(id) FROM tenants WHERE gallery::text LIKE '%/api/files/%' OR gallery::text LIKE '%uploads/%'`,
    `SELECT COUNT(id) FROM tenants WHERE settings::text LIKE '%/api/files/%' OR settings::text LIKE '%uploads/%'`,
    `SELECT COUNT(id) FROM posts WHERE content LIKE '%/api/files/%' OR content LIKE '%uploads/%'`
  ]

  console.log("\n--- RAW QUERIES ---")
  for (const query of rawQueries) {
    try {
      const result = await prisma.$queryRawUnsafe(query)
      console.log(query, "=>", result)
    } catch (e) {
      console.error("Error executing query:", query, e.message)
    }
  }
}

main().finally(() => prisma.$disconnect())
