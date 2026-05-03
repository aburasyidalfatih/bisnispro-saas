import { db } from "@/lib/db"
import nodemailer from "nodemailer"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { logger } from "@/lib/logger"
import { sendWhatsApp, getWaConfig } from "@/lib/services/notification"

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
      const tpl =
        settings.WA_TEMPLATE_REVISION ||
        `Halo {{adminName}},\n\nTerima kasih telah mendaftar. Namun, ada beberapa data yang perlu diperbaiki:\n\n"{{adminMessage}}"\n\nSilakan hubungi kami untuk melakukan perbaikan data.`
      message = tpl
        .replace(/{{adminName}}/g, app.adminName)
        .replace(/{{adminMessage}}/g, app.adminMessage || "")
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

  // 1. Kirim Email
  if (settings.SMTP_HOST && settings.SMTP_USER) {
    try {
      const transporter = nodemailer.createTransport({
        host: settings.SMTP_HOST,
        port: Number(settings.SMTP_PORT) || 587,
        secure: Number(settings.SMTP_PORT) === 465,
        auth: { user: settings.SMTP_USER, pass: settings.SMTP_PASS },
      })
      await transporter.sendMail({
        from: `"${platformName}" <${settings.SMTP_FROM || settings.SMTP_USER}>`,
        to: app.adminEmail,
        subject,
        html: `<div style="font-family: sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #4f46e5;">${platformName}</h2>
                <p>${message.replace(/\n/g, "<br>")}</p>
              </div>`,
      })
      logger.info("Application email sent", { applicationId, status: app.status })
    } catch (err) {
      logger.error("Application email failed", err, { applicationId })
    }
  } else {
    logger.warn("SMTP not configured — email notification skipped", { applicationId })
  }

  // 2. Kirim WhatsApp ke pendaftar (menggunakan helper terpusat)
  if (app.adminPhone) {
    const result = await sendWhatsApp(app.adminPhone, `*${subject}*\n\n${message}`)
    if (!result.success) {
      logger.warn("Application WA notification skipped", { applicationId, error: result.error })
    } else {
      logger.info("Application WA sent", { applicationId, status: app.status })
    }
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

  // Cek apakah WA gateway dikonfigurasi
  const waConfig = await getWaConfig()
  if (!waConfig.apiKey) {
    logger.warn("WA gateway not configured — new application alerts skipped", { applicationId })
    return
  }

  // 1. Alert ke semua Super Admin
  const superAdmins = await db.user.findMany({
    where: { isSuperAdmin: true, isActive: true },
    select: { id: true, phone: true, name: true },
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
  }

  // 2. Alert ke Mitra Afiliasi jika ada referral
  if (affiliateId) {
    const affiliate = await db.affiliateProfile.findUnique({
      where: { id: affiliateId },
      include: { user: { select: { phone: true, name: true } } },
    })

    if (!affiliate) return

    if (!affiliate.user.phone) {
      logger.warn("Affiliate has no phone number — alert skipped", { affiliateId })
      return
    }

    const defaultAffiliateTpl = `*LEAD SEKOLAH BARU! 🎉*\n\nHalo {{affiliateName}},\nKabar baik! Pendaftaran sekolah baru telah masuk menggunakan kode referral Anda ({{referralCode}}).\n\nSekolah: {{schoolName}}\nStatus: PENDING (Menunggu Review)\n\nSilakan pantau perkembangan lead Anda di Dashboard Mitra Afiliasi.`
    const affiliateMsg = (settings.WA_TEMPLATE_ALERT_AFFILIATE || defaultAffiliateTpl)
      .replace(/{{affiliateName}}/g, affiliate.user.name)
      .replace(/{{referralCode}}/g, affiliate.referralCode)
      .replace(/{{schoolName}}/g, app.schoolName)

    await sendWhatsApp(affiliate.user.phone, affiliateMsg)
  }
}

/**
 * Logika menyetujui pengajuan dan membuat tenant baru.
 */
export async function approveApplication(id: string) {
  const app = await db.tenantApplication.findUnique({ where: { id } })
  if (!app) throw new Error("Pengajuan tidak ditemukan")

  // 1. Buat Tenant Baru
  const tenant = await db.tenant.create({
    data: {
      name: app.schoolName,
      slug: app.schoolSlug,
      email: app.adminEmail,
      phone: app.adminPhone,
      address: app.address,
      logo: app.logo,
      isActive: true,
      plan: "free",
      settings: {
        npsn: app.npsn,
        province: app.province,
        regency: app.regency,
        schoolStatus: app.schoolStatus,
      },
    },
  })

  // 2. Cek apakah user admin sudah ada
  let user = await db.user.findUnique({ where: { email: app.adminEmail } })
  const tempPassword = crypto.randomBytes(8).toString("base64url")

  if (!user) {
    const hashedPassword = await bcrypt.hash(tempPassword, 12)
    user = await db.user.create({
      data: {
        name: app.adminName,
        email: app.adminEmail,
        password: hashedPassword,
        phone: app.adminPhone,
      },
    })
  }

  // 3. Hubungkan User ke Tenant sebagai Owner
  await db.tenantUser.create({
    data: { tenantId: tenant.id, userId: user.id, role: "owner" },
  })

  // 4. Update status + simpan temp password untuk notifikasi
  await db.tenantApplication.update({
    where: { id },
    data: { status: "APPROVED", adminMessage: `temp_pwd:${tempPassword}` },
  })

  // 5. Kirim notifikasi (membaca tempPassword dari adminMessage)
  await sendApplicationNotification(id)

  // 6. Hapus temp password dari record setelah notifikasi terkirim
  await db.tenantApplication.update({
    where: { id },
    data: { adminMessage: null },
  })

  return tenant
}
