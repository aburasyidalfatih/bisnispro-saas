import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Memulai migrasi URL lokal ke R2 Cloudflare (Tahap 2: /api/files/)...")
  const oldPrefix = "/api/files/"
  const newPrefix = "https://cdn.schoolpro.id/"
  
  let totalUpdates = 0

  // 1. Tenant
  console.log("Migrasi Tenant (logo, heroImage)...")
  const tenants = await prisma.tenant.findMany({
    where: {
      OR: [
        { logo: { startsWith: oldPrefix } },
        { heroImage: { startsWith: oldPrefix } }
      ]
    }
  })
  for (const tenant of tenants) {
    const data: any = {}
    if (tenant.logo?.startsWith(oldPrefix)) data.logo = tenant.logo.replace(oldPrefix, newPrefix)
    if (tenant.heroImage?.startsWith(oldPrefix)) data.heroImage = tenant.heroImage.replace(oldPrefix, newPrefix)
    await prisma.tenant.update({ where: { id: tenant.id }, data })
  }
  console.log(`- Tenant: ${tenants.length} records updated.`)
  totalUpdates += tenants.length

  // 2. User (avatar)
  console.log("Migrasi User (avatar)...")
  const users = await prisma.user.findMany({
    where: { avatar: { startsWith: oldPrefix } }
  })
  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: { avatar: user.avatar!.replace(oldPrefix, newPrefix) }
    })
  }
  console.log(`- User: ${users.length} records updated.`)
  totalUpdates += users.length

  // 3. Post (featuredImage)
  console.log("Migrasi Post (featuredImage)...")
  const posts = await prisma.post.findMany({
    where: { featuredImage: { startsWith: oldPrefix } }
  })
  for (const post of posts) {
    await prisma.post.update({
      where: { id: post.id },
      data: { featuredImage: post.featuredImage!.replace(oldPrefix, newPrefix) }
    })
  }
  console.log(`- Post: ${posts.length} records updated.`)
  totalUpdates += posts.length

  // 4. TenantGallery
  console.log("Migrasi TenantGallery (imageUrl)...")
  const galleries = await prisma.tenantGallery.findMany({
    where: { imageUrl: { startsWith: oldPrefix } }
  })
  for (const gallery of galleries) {
    await prisma.tenantGallery.update({
      where: { id: gallery.id },
      data: { imageUrl: gallery.imageUrl.replace(oldPrefix, newPrefix) }
    })
  }
  console.log(`- TenantGallery: ${galleries.length} records updated.`)
  totalUpdates += galleries.length

  // 5. Achievement
  console.log("Migrasi Achievement (imageUrl)...")
  const achievements = await prisma.achievement.findMany({
    where: { imageUrl: { startsWith: oldPrefix } }
  })
  for (const achievement of achievements) {
    await prisma.achievement.update({
      where: { id: achievement.id },
      data: { imageUrl: achievement.imageUrl!.replace(oldPrefix, newPrefix) }
    })
  }
  console.log(`- Achievement: ${achievements.length} records updated.`)
  totalUpdates += achievements.length

  // 6. Facility
  console.log("Migrasi Facility (imageUrl)...")
  const facilities = await prisma.facility.findMany({
    where: { imageUrl: { startsWith: oldPrefix } }
  })
  for (const facility of facilities) {
    await prisma.facility.update({
      where: { id: facility.id },
      data: { imageUrl: facility.imageUrl!.replace(oldPrefix, newPrefix) }
    })
  }
  console.log(`- Facility: ${facilities.length} records updated.`)
  totalUpdates += facilities.length

  // 7. Extracurricular
  console.log("Migrasi Extracurricular (imageUrl)...")
  const extracurriculars = await prisma.extracurricular.findMany({
    where: { imageUrl: { startsWith: oldPrefix } }
  })
  for (const extracurricular of extracurriculars) {
    await prisma.extracurricular.update({
      where: { id: extracurricular.id },
      data: { imageUrl: extracurricular.imageUrl!.replace(oldPrefix, newPrefix) }
    })
  }
  console.log(`- Extracurricular: ${extracurriculars.length} records updated.`)
  totalUpdates += extracurriculars.length

  // 8. Program
  console.log("Migrasi Program (imageUrl)...")
  const programs = await prisma.program.findMany({
    where: { imageUrl: { startsWith: oldPrefix } }
  })
  for (const program of programs) {
    await prisma.program.update({
      where: { id: program.id },
      data: { imageUrl: program.imageUrl!.replace(oldPrefix, newPrefix) }
    })
  }
  console.log(`- Program: ${programs.length} records updated.`)
  totalUpdates += programs.length

  // 9. Alumni
  console.log("Migrasi Alumni (imageUrl)...")
  const alumniList = await prisma.alumni.findMany({
    where: { imageUrl: { startsWith: oldPrefix } }
  })
  for (const alumni of alumniList) {
    await prisma.alumni.update({
      where: { id: alumni.id },
      data: { imageUrl: alumni.imageUrl!.replace(oldPrefix, newPrefix) }
    })
  }
  console.log(`- Alumni: ${alumniList.length} records updated.`)
  totalUpdates += alumniList.length

  // 10. Staff
  console.log("Migrasi Staff (imageUrl)...")
  const staffList = await prisma.staff.findMany({
    where: { imageUrl: { startsWith: oldPrefix } }
  })
  for (const staff of staffList) {
    await prisma.staff.update({
      where: { id: staff.id },
      data: { imageUrl: staff.imageUrl!.replace(oldPrefix, newPrefix) }
    })
  }
  console.log(`- Staff: ${staffList.length} records updated.`)
  totalUpdates += staffList.length

  // 11. Document
  console.log("Migrasi Document (fileUrl)...")
  const documents = await prisma.document.findMany({
    where: { fileUrl: { startsWith: oldPrefix } }
  })
  for (const doc of documents) {
    await prisma.document.update({
      where: { id: doc.id },
      data: { fileUrl: doc.fileUrl.replace(oldPrefix, newPrefix) }
    })
  }
  console.log(`- Document: ${documents.length} records updated.`)
  totalUpdates += documents.length

  // 12. Popup
  console.log("Migrasi Popup (imageUrl, videoUrl)...")
  const popups = await prisma.popup.findMany({
    where: {
      OR: [
        { imageUrl: { startsWith: oldPrefix } },
        { videoUrl: { startsWith: oldPrefix } }
      ]
    }
  })
  for (const popup of popups) {
    const data: any = {}
    if (popup.imageUrl?.startsWith(oldPrefix)) data.imageUrl = popup.imageUrl.replace(oldPrefix, newPrefix)
    if (popup.videoUrl?.startsWith(oldPrefix)) data.videoUrl = popup.videoUrl.replace(oldPrefix, newPrefix)
    await prisma.popup.update({ where: { id: popup.id }, data })
  }
  console.log(`- Popup: ${popups.length} records updated.`)
  totalUpdates += popups.length

  // 13. Slider
  console.log("Migrasi Slider (imageUrl)...")
  const sliders = await prisma.slider.findMany({
    where: { imageUrl: { startsWith: oldPrefix } }
  })
  for (const slider of sliders) {
    await prisma.slider.update({
      where: { id: slider.id },
      data: { imageUrl: slider.imageUrl.replace(oldPrefix, newPrefix) }
    })
  }
  console.log(`- Slider: ${sliders.length} records updated.`)
  totalUpdates += sliders.length

  console.log("====================================")
  console.log(`Migrasi Selesai! Total ${totalUpdates} records berhasil diupdate.`)
}

main()
  .catch((e) => {
    console.error("Error saat migrasi:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
