import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Memulai migrasi URL lokal ke R2 Cloudflare (Tahap 4: Tabel Ekstra)...")
  const oldPrefix = "/api/files/"
  const newPrefix = "https://cdn.schoolpro.id/"
  let totalUpdates = 0

  // 1. CanteenMerchant (imageUrl)
  const canteenMerchants = await prisma.canteenMerchant.findMany({
    where: { imageUrl: { startsWith: oldPrefix } }
  })
  for (const item of canteenMerchants) {
    await prisma.canteenMerchant.update({
      where: { id: item.id },
      data: { imageUrl: item.imageUrl!.replace(oldPrefix, newPrefix) }
    })
  }
  if (canteenMerchants.length > 0) console.log(`- CanteenMerchant: ${canteenMerchants.length} records updated.`)
  totalUpdates += canteenMerchants.length

  // 2. CanteenProduct (imageUrl)
  const canteenProducts = await prisma.canteenProduct.findMany({
    where: { imageUrl: { startsWith: oldPrefix } }
  })
  for (const item of canteenProducts) {
    await prisma.canteenProduct.update({
      where: { id: item.id },
      data: { imageUrl: item.imageUrl!.replace(oldPrefix, newPrefix) }
    })
  }
  if (canteenProducts.length > 0) console.log(`- CanteenProduct: ${canteenProducts.length} records updated.`)
  totalUpdates += canteenProducts.length

  // 3. Partnership (imageUrl)
  const partnerships = await prisma.partnership.findMany({
    where: { imageUrl: { startsWith: oldPrefix } }
  })
  for (const item of partnerships) {
    await prisma.partnership.update({
      where: { id: item.id },
      data: { imageUrl: item.imageUrl!.replace(oldPrefix, newPrefix) }
    })
  }
  if (partnerships.length > 0) console.log(`- Partnership: ${partnerships.length} records updated.`)
  totalUpdates += partnerships.length

  // 4. AttendanceRecord (proofUrl)
  const attendanceRecords = await prisma.attendanceRecord.findMany({
    where: { proofUrl: { startsWith: oldPrefix } }
  })
  for (const item of attendanceRecords) {
    await prisma.attendanceRecord.update({
      where: { id_academicYear: { id: item.id, academicYear: item.academicYear } },
      data: { proofUrl: item.proofUrl!.replace(oldPrefix, newPrefix) }
    })
  }
  if (attendanceRecords.length > 0) console.log(`- AttendanceRecord: ${attendanceRecords.length} records updated.`)
  totalUpdates += attendanceRecords.length

  // 5. AttendancePermit (proofUrl)
  const attendancePermits = await prisma.attendancePermit.findMany({
    where: { proofUrl: { startsWith: oldPrefix } }
  })
  for (const item of attendancePermits) {
    await prisma.attendancePermit.update({
      where: { id: item.id },
      data: { proofUrl: item.proofUrl!.replace(oldPrefix, newPrefix) }
    })
  }
  if (attendancePermits.length > 0) console.log(`- AttendancePermit: ${attendancePermits.length} records updated.`)
  totalUpdates += attendancePermits.length

  // 6. TenantApplication (logo)
  const tenantApplications = await prisma.tenantApplication.findMany({
    where: { logo: { startsWith: oldPrefix } }
  })
  for (const item of tenantApplications) {
    await prisma.tenantApplication.update({
      where: { id: item.id },
      data: { logo: item.logo!.replace(oldPrefix, newPrefix) }
    })
  }
  if (tenantApplications.length > 0) console.log(`- TenantApplication: ${tenantApplications.length} records updated.`)
  totalUpdates += tenantApplications.length

  console.log("====================================")
  console.log(`Migrasi Selesai! Total ${totalUpdates} records ekstra berhasil diupdate.`)
}

main()
  .catch((e) => {
    console.error("Error saat migrasi:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
