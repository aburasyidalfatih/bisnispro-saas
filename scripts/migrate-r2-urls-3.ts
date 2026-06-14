import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Memulai migrasi URL lokal ke R2 Cloudflare (Tahap 3: Deep Replace JSON & HTML)...")
  
  let totalUpdates = 0

  function replaceAllUrls(text: string): string {
    if (!text) return text
    // Replace "/api/files/" with "https://cdn.schoolpro.id/"
    let replaced = text.split("/api/files/").join("https://cdn.schoolpro.id/")
    // Replace "uploads/" with "https://cdn.schoolpro.id/"
    // Note: To avoid accidentally replacing 'uploads/' in other contexts, we check for '/uploads/' or 'uploads/' carefully.
    // However, since we're only selecting records that have the image paths, a simple split join is effective.
    replaced = replaced.split("/uploads/").join("https://cdn.schoolpro.id/")
    replaced = replaced.split("\"uploads/").join("\"https://cdn.schoolpro.id/") // for JSON fields
    replaced = replaced.split(" uploads/").join(" https://cdn.schoolpro.id/") // for HTML attributes
    return replaced
  }

  // 1. Post.content (HTML)
  console.log("Migrasi Post (content HTML)...")
  const posts = await prisma.post.findMany({
    where: {
      OR: [
        { content: { contains: "/api/files/" } },
        { content: { contains: "uploads/" } }
      ]
    }
  })
  for (const post of posts) {
    const newContent = replaceAllUrls(post.content)
    await prisma.post.update({
      where: { id: post.id },
      data: { content: newContent }
    })
  }
  console.log(`- Post content: ${posts.length} records updated.`)
  totalUpdates += posts.length

  // 2. Tenant JSON fields (gallery, settings, etc.)
  console.log("Migrasi Tenant (gallery, settings JSON)...")
  // Fetching all tenants that might have it
  const tenants = await prisma.$queryRawUnsafe<any[]>(`
    SELECT id, gallery, settings 
    FROM tenants 
    WHERE gallery::text LIKE '%/api/files/%' 
       OR gallery::text LIKE '%uploads/%'
       OR settings::text LIKE '%/api/files/%'
       OR settings::text LIKE '%uploads/%'
  `)
  
  for (const tenant of tenants) {
    const updateData: any = {}
    
    if (tenant.gallery) {
      const galleryStr = typeof tenant.gallery === 'string' ? tenant.gallery : JSON.stringify(tenant.gallery)
      if (galleryStr.includes("/api/files/") || galleryStr.includes("uploads/")) {
        updateData.gallery = JSON.parse(replaceAllUrls(galleryStr))
      }
    }
    
    if (tenant.settings) {
      const settingsStr = typeof tenant.settings === 'string' ? tenant.settings : JSON.stringify(tenant.settings)
      if (settingsStr.includes("/api/files/") || settingsStr.includes("uploads/")) {
        updateData.settings = JSON.parse(replaceAllUrls(settingsStr))
      }
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: updateData
      })
    }
  }
  console.log(`- Tenant JSON fields: ${tenants.length} records updated.`)
  totalUpdates += tenants.length

  console.log("====================================")
  console.log(`Migrasi Selesai! Total ${totalUpdates} records berhasil diupdate pada deep inspection.`)
}

main()
  .catch((e) => {
    console.error("Error saat migrasi:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
