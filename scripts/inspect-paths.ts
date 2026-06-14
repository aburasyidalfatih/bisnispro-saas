import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("=== TENANT ===")
  const tenants = await prisma.tenant.findMany({ take: 5, where: { logo: { not: null } } })
  console.log("Logos:", tenants.map(t => t.logo))

  console.log("=== POST ===")
  const posts = await prisma.post.findMany({ take: 5, where: { featuredImage: { not: null } } })
  console.log("FeaturedImages:", posts.map(p => p.featuredImage))

  console.log("=== STAFF ===")
  const staffs = await prisma.staff.findMany({ take: 5, where: { imageUrl: { not: null } } })
  console.log("StaffImages:", staffs.map(s => s.imageUrl))
  
  console.log("=== GALLERY ===")
  const galleries = await prisma.tenantGallery.findMany({ take: 5, where: { imageUrl: { not: null } } })
  console.log("GalleryImages:", galleries.map(g => g.imageUrl))
}

main().finally(() => prisma.$disconnect())
