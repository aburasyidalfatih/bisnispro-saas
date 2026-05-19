import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { logger } from "@/lib/logger"
import { sendWhatsApp, getWaConfig, sendEmail } from "@/features/notification/services/notification.service"
/**
 * Mengambil semua pengaturan platform sebagai key-value map.
 */
async function getPlatformSettings(): Promise<Record<string, string>> {
  const settings = await db.platformSetting.findMany()
  const map: Record<string, string> = {}
  settings.forEach((s) => {
    if (s.value) map[s.key] = s.value
  })
  return map
}

/**
 * Mengirim notifikasi status pendaftaran (Email & WA) ke pendaftar sekolah.
 * Dipanggil saat: PENDING (setelah daftar), APPROVED, REVISION, REJECTED.
 */
export async function sendApplicationNotification(applicationId: string) {
  const app = await db.tenantApplication.findUnique({ where: { id: applicationId } })
  if (!app) return

  const settings = await getPlatformSettings()
  const platformName = settings.platform_name || "SchoolPro"
  const rootDomain = settings.NEXT_PUBLIC_ROOT_DOMAIN || process.env.NEXT_PUBLIC_ROOT_DOMAIN || "schoolpro.id"

  let subject = ""
  let message = ""

  switch (app.status) {
    case "PENDING": {
      subject = settings.WA_SUBJECT_PENDING || `Pendaftaran ${app.schoolName} Berhasil Diterima`
      const tpl =
        settings.WA_TEMPLATE_PENDING ||
        `Halo {{adminName}},\n\nSelamat! Formulir pendaftaran sekolah {{schoolName}} telah kami terima dan saat ini sudah masuk ke dalam antrean peninjauan tim kami.\n\nKami akan segera menghubungi Anda kembali setelah proses verifikasi selesai.\n\nTerima kasih.`
      message = tpl
        .replace(/{{adminName}}/g, app.adminName)
        .replace(/{{schoolName}}/g, app.schoolName)
      break
    }
    case "APPROVED": {
      const tempPwd = app.adminMessage?.startsWith("temp_pwd:")
        ? app.adminMessage.replace("temp_pwd:", "")
        : "Hubungi admin untuk mendapatkan password"
      const loginUrl = `https://${app.schoolSlug}.${rootDomain}/login`
      subject = settings.WA_SUBJECT_APPROVED || `Selamat! Pendaftaran ${app.schoolName} Disetujui`
      const tpl =
        settings.WA_TEMPLATE_APPROVED ||
        `Halo {{adminName}},\n\nPendaftaran sekolah {{schoolName}} telah disetujui. Anda sekarang dapat mengakses dashboard sekolah menggunakan kredensial berikut:\n\nURL Login: {{loginUrl}}\nEmail: {{adminEmail}}\nPassword Sementara: {{tempPwd}}\n\n⚠️ PENTING: Harap segera mengganti password Anda setelah berhasil login pertama kali demi keamanan akun Anda.\n\nTerima kasih.`
      message = tpl
        .replace(/{{adminName}}/g, app.adminName)
        .replace(/{{schoolName}}/g, app.schoolName)
        .replace(/{{loginUrl}}/g, loginUrl)
        .replace(/{{adminEmail}}/g, app.adminEmail)
        .replace(/{{tempPwd}}/g, tempPwd)
      break
    }
    case "REVISION": {
      subject = settings.WA_SUBJECT_REVISION || `Permintaan Revisi Pendaftaran: ${app.schoolName}`
      const revisionUrl = `https://${rootDomain}/revisi-pengajuan/${app.id}`
      const tpl =
        settings.WA_TEMPLATE_REVISION ||
        `Halo {{adminName}},\n\nTerima kasih telah mendaftar. Namun, ada beberapa data yang perlu diperbaiki:\n\n"{{adminMessage}}"\n\nSilakan klik disini untuk melengkapi data: {{revisionUrl}}`
      message = tpl
        .replace(/{{adminName}}/g, app.adminName)
        .replace(/{{adminMessage}}/g, app.adminMessage || "")
        .replace(/{{revisionUrl}}/g, revisionUrl)
      break
    }
    case "REJECTED": {
      subject = settings.WA_SUBJECT_REJECTED || `Update Pendaftaran: ${app.schoolName}`
      const tpl =
        settings.WA_TEMPLATE_REJECTED ||
        `Halo {{adminName}},\n\nMohon maaf, pendaftaran sekolah {{schoolName}} belum dapat kami setujui saat ini.\n\nAlasan: {{adminMessage}}\n\nTerima kasih atas minat Anda.`
      message = tpl
        .replace(/{{adminName}}/g, app.adminName)
        .replace(/{{schoolName}}/g, app.schoolName)
        .replace(/{{adminMessage}}/g, app.adminMessage || "")
      break
    }
  }

  if (!subject) return

  // 1. Kirim Email (menggunakan helper terpusat)
  const emailHtml = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 24px; border-radius: 12px 12px 0 0; color: white;">
        <h2 style="margin: 0;">${subject}</h2>
        <p style="margin: 4px 0 0; opacity: 0.9;">${platformName}</p>
      </div>
      <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; line-height: 1.6;">
        <p>${message.replace(/\n/g, "<br>")}</p>
      </div>
      <div style="background: #f1f5f9; padding: 12px 24px; border-radius: 0 0 12px 12px; text-align: center; color: #94a3b8; font-size: 12px;">
        ${platformName} — Platform Edukasi Terintegrasi
      </div>
      <img src="https://${rootDomain}/api/public/track-email/${app.id}" width="1" height="1" style="display:none;" alt="" />
    </div>`

  await sendEmail(app.adminEmail, subject, emailHtml)
    .then(() => logger.info("Application email sent", { applicationId, status: app.status }))
    .catch((err) => logger.error("Application email failed", err, { applicationId }))

  // 2. Kirim WhatsApp ke pendaftar (menggunakan helper terpusat)
  const disableWa = settings.DISABLE_WA_NOTIFICATION === "true" || process.env.DISABLE_WA_NOTIFICATION === "true"
  if (!disableWa && app.adminPhone) {
    const result = await sendWhatsApp(app.adminPhone, `*${subject}*\n\n${message}`)
    if (!result.success) {
      logger.warn("Application WA notification skipped", { applicationId, error: result.error })
    } else {
      logger.info("Application WA sent", { applicationId, status: app.status })
    }
  } else if (disableWa) {
    logger.info("WhatsApp notification disabled globally via settings", { applicationId })
  }
}

/**
 * Mengirim alert WA ke Super Admin dan Mitra Afiliasi ketika ada pendaftaran sekolah baru.
 */
export async function sendNewApplicationAlerts(
  applicationId: string,
  affiliateId?: string | null
) {
  const app = await db.tenantApplication.findUnique({ where: { id: applicationId } })
  if (!app) return

  const settings = await getPlatformSettings()
  const rootDomain = settings.NEXT_PUBLIC_ROOT_DOMAIN || process.env.NEXT_PUBLIC_ROOT_DOMAIN || "schoolpro.id"


  // 1. Alert ke semua Super Admin
  const superAdmins = await db.user.findMany({
    where: { isSuperAdmin: true, isActive: true },
    select: { id: true, phone: true, name: true, email: true },
  })

  const defaultAdminTpl = `*PENDAFTARAN SEKOLAH BARU*\n\nSekolah: {{schoolName}}\nAdmin: {{adminName}}\nWA: {{adminPhone}}\nSubdomain: {{schoolSlug}}.${rootDomain}\n\nSilakan cek di Panel Super Admin untuk meninjau pengajuan ini.`
  const adminMsg = (settings.WA_TEMPLATE_ALERT_SUPERADMIN || defaultAdminTpl)
    .replace(/{{schoolName}}/g, app.schoolName)
    .replace(/{{adminName}}/g, app.adminName)
    .replace(/{{adminPhone}}/g, app.adminPhone)
    .replace(/{{schoolSlug}}/g, app.schoolSlug)

  for (const admin of superAdmins) {
    if (admin.phone) {
      await sendWhatsApp(admin.phone, adminMsg)
    } else {
      logger.warn("Super Admin has no phone number — alert skipped", { adminId: admin.id })
    }
    if (admin.email) {
      await sendEmail(
        admin.email,
        "PENDAFTARAN SEKOLAH BARU",
        `<div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #dc2626, #ef4444); padding: 24px; border-radius: 12px 12px 0 0; color: white;">
            <h2 style="margin: 0;">🏫 Pendaftaran Sekolah Baru</h2>
            <p style="margin: 4px 0 0; opacity: 0.9;">Super Admin Alert</p>
          </div>
          <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; line-height: 1.6;">
            <p>${adminMsg.replace(/\n/g, "<br>")}</p>
          </div>
          <div style="background: #f1f5f9; padding: 12px 24px; border-radius: 0 0 12px 12px; text-align: center; color: #94a3b8; font-size: 12px;">
            SchoolPro — Platform Edukasi Terintegrasi
          </div>
        </div>`
      ).catch(err => logger.error("Super Admin email alert failed", err, { adminId: admin.id }))
    }
  }

  // 2. Alert ke Mitra Afiliasi jika ada referral
  if (affiliateId) {
    const affiliate = await db.affiliateProfile.findUnique({
      where: { id: affiliateId },
      include: { user: { select: { phone: true, name: true, email: true } } },
    })

    if (!affiliate) return

    const defaultAffiliateTpl = `*LEAD SEKOLAH BARU! 🎉*\n\nHalo {{affiliateName}},\nKabar baik! Pendaftaran sekolah baru telah masuk menggunakan kode referral Anda ({{referralCode}}).\n\nSekolah: {{schoolName}}\nStatus: PENDING (Menunggu Review)\n\nSilakan pantau perkembangan lead Anda di Dashboard Mitra Afiliasi.`
    const affiliateMsg = (settings.WA_TEMPLATE_ALERT_AFFILIATE || defaultAffiliateTpl)
      .replace(/{{affiliateName}}/g, affiliate.user.name)
      .replace(/{{referralCode}}/g, affiliate.referralCode)
      .replace(/{{schoolName}}/g, app.schoolName)

    if (affiliate.user.phone) {
      await sendWhatsApp(affiliate.user.phone, affiliateMsg)
    } else {
      logger.warn("Affiliate has no phone number — alert skipped", { affiliateId })
    }

    if (affiliate.user.email) {
      await sendEmail(
        affiliate.user.email,
        "LEAD SEKOLAH BARU! 🎉",
        `<div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 24px; border-radius: 12px 12px 0 0; color: white;">
            <h2 style="margin: 0;">🎉 Lead Sekolah Baru!</h2>
            <p style="margin: 4px 0 0; opacity: 0.9;">Program Mitra Afiliasi</p>
          </div>
          <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; line-height: 1.6;">
            <p>${affiliateMsg.replace(/\n/g, "<br>")}</p>
          </div>
          <div style="background: #f1f5f9; padding: 12px 24px; border-radius: 0 0 12px 12px; text-align: center; color: #94a3b8; font-size: 12px;">
            SchoolPro — Program Mitra Afiliasi
          </div>
        </div>`
      ).catch(err => logger.error("Affiliate email alert failed", err, { affiliateId }))
    }
  }
}

/**
 * Logika menyetujui pengajuan dan membuat tenant baru.
 */
export async function approveApplication(id: string) {
  const app = await db.tenantApplication.findUnique({ where: { id } })
  if (!app) throw new Error("Pengajuan tidak ditemukan")

  // 1. Cek apakah tenant dengan slug yang sama sudah ada (misal: re-approve setelah revisi)
  let tenant = await db.tenant.findUnique({ where: { slug: app.schoolSlug } })

  if (tenant) {
    // Update data tenant yang sudah ada dengan data terbaru dari pengajuan
    tenant = await db.tenant.update({
      where: { id: tenant.id },
      data: {
        name: app.schoolName,
        email: app.adminEmail,
        phone: app.adminPhone,
        address: app.address,
        logo: app.logo,
        isActive: true,
        affiliateId: app.affiliateId,
        settings: {
          npsn: app.npsn,
          province: app.province,
          regency: app.regency,
          schoolStatus: app.schoolStatus,
          adminPosition: app.adminPosition,
        },
      },
    })
  } else {
    // Fetch free plan from database to get the maxStudents quota
    const freePlan = await db.subscriptionPlan.findUnique({ where: { slug: "free" } })
    const quota = freePlan ? freePlan.maxStudents : 0

    // Buat Tenant Baru
    tenant = await db.tenant.create({
      data: {
        name: app.schoolName,
        slug: app.schoolSlug,
        email: app.adminEmail,
        phone: app.adminPhone,
        address: app.address,
        logo: app.logo,
        isActive: true,
        plan: "free",
        planId: freePlan ? freePlan.id : undefined,
        studentQuota: quota,
        affiliateId: app.affiliateId,
        settings: {
          npsn: app.npsn,
          province: app.province,
          regency: app.regency,
          schoolStatus: app.schoolStatus,
          adminPosition: app.adminPosition,
        },
      },
    })
  }



  // 2. Cek apakah user admin sudah ada
  const adminEmail = app.adminEmail.toLowerCase()
  let user = await db.user.findUnique({ where: { email: adminEmail } })
  let tempPassword = ""

  if (!user) {
    tempPassword = crypto.randomBytes(8).toString("base64url")
    const hashedPassword = await bcrypt.hash(tempPassword, 12)
    user = await db.user.create({
      data: {
        name: app.adminName,
        email: adminEmail,
        password: hashedPassword,
        phone: app.adminPhone,
      },
    })
  } else {
    tempPassword = "(Gunakan password akun Anda sebelumnya)"
  }

  // 3. Hubungkan User ke Tenant sebagai Owner (cek duplikat)
  const existingTenantUser = await db.tenantUser.findUnique({
    where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } }
  })

  if (!existingTenantUser) {
    await db.tenantUser.create({
      data: { tenantId: tenant.id, userId: user.id, role: "owner" },
    })
  }

  // 4. Update status + simpan temp password untuk notifikasi sementara
  await db.tenantApplication.update({
    where: { id },
    data: { status: "APPROVED", adminMessage: `temp_pwd:${tempPassword}` },
  })

  // 5. Kirim notifikasi langsung (bypass Inngest yang tidak aktif di Docker)
  sendApplicationNotification(id)
    .then(async () => {
      // Bersihkan password sementara setelah notif terkirim
      await db.tenantApplication.update({
        where: { id },
        data: { adminMessage: null },
      }).catch(e => logger.error("Failed to clear temp password", e))
    })
    .catch(err => logger.error("Application notification failed", err))

  return tenant
}
