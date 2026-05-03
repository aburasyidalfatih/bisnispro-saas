import { db } from "@/lib/db"
import nodemailer from "nodemailer"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { logger } from "@/lib/logger"

/**
 * Mengambil pengaturan platform secara dinamis dari database
 */
async function getPlatformSettings() {
  const settings = await db.platformSetting.findMany()
  const map: Record<string, string> = {}
  settings.forEach(s => map[s.key] = s.value)
  return map
}

/**
 * Mengirim notifikasi status pendaftaran (Email & WA)
 */
export async function sendApplicationNotification(applicationId: string) {
  const app = await db.tenantApplication.findUnique({ where: { id: applicationId } })
  if (!app) return

  const settings = await getPlatformSettings()
  const platformName = settings.platform_name || "SchoolPro"

  let subject = ""
  let message = ""

  switch (app.status) {
    case "PENDING":
      subject = settings.WA_SUBJECT_PENDING || `Pendaftaran ${app.schoolName} Berhasil Diterima`
      const tplPending = settings.WA_TEMPLATE_PENDING || `Halo {{adminName}},\n\nSelamat! Formulir pendaftaran sekolah {{schoolName}} telah kami terima dan saat ini sudah masuk ke dalam antrean peninjauan tim kami.\n\nKami akan segera menghubungi Anda kembali setelah proses verifikasi selesai.\n\nTerima kasih.`
      message = tplPending.replace(/{{adminName}}/g, app.adminName).replace(/{{schoolName}}/g, app.schoolName)
      break
    case "APPROVED":
      const tempPwd = app.adminMessage?.startsWith("temp_pwd:") ? app.adminMessage.replace("temp_pwd:", "") : "Hubungi admin untuk mendapatkan password"
      const loginUrl = `https://${app.schoolSlug}.${settings.NEXT_PUBLIC_ROOT_DOMAIN || 'schoolpro.id'}/login`
      subject = settings.WA_SUBJECT_APPROVED || `Selamat! Pendaftaran ${app.schoolName} Disetujui`
      const tplApproved = settings.WA_TEMPLATE_APPROVED || `Halo {{adminName}},\n\nPendaftaran sekolah {{schoolName}} telah disetujui. Anda sekarang dapat mengakses dashboard sekolah menggunakan kredensial berikut:\n\nURL Login: {{loginUrl}}\nEmail: {{adminEmail}}\nPassword Sementara: {{tempPwd}}\n\n⚠️ PENTING: Harap segera mengganti password Anda setelah berhasil login pertama kali demi keamanan akun Anda.\n\nTerima kasih.`
      message = tplApproved
        .replace(/{{adminName}}/g, app.adminName)
        .replace(/{{schoolName}}/g, app.schoolName)
        .replace(/{{loginUrl}}/g, loginUrl)
        .replace(/{{adminEmail}}/g, app.adminEmail)
        .replace(/{{tempPwd}}/g, tempPwd)
      break
    case "REVISION":
      subject = settings.WA_SUBJECT_REVISION || `Permintaan Revisi Pendaftaran: ${app.schoolName}`
      const tplRevision = settings.WA_TEMPLATE_REVISION || `Halo {{adminName}},\n\nTerima kasih telah mendaftar. Namun, ada beberapa data yang perlu diperbaiki:\n\n"{{adminMessage}}"\n\nSilakan hubungi kami untuk melakukan perbaikan data.`
      message = tplRevision.replace(/{{adminName}}/g, app.adminName).replace(/{{adminMessage}}/g, app.adminMessage || "")
      break
    case "REJECTED":
      subject = settings.WA_SUBJECT_REJECTED || `Update Pendaftaran: ${app.schoolName}`
      const tplRejected = settings.WA_TEMPLATE_REJECTED || `Halo {{adminName}},\n\nMohon maaf, pendaftaran sekolah {{schoolName}} belum dapat kami setujui saat ini.\n\nAlasan: {{adminMessage}}\n\nTerima kasih atas minat Anda.`
      message = tplRejected.replace(/{{adminName}}/g, app.adminName).replace(/{{schoolName}}/g, app.schoolName).replace(/{{adminMessage}}/g, app.adminMessage || "")
      break
  }

  if (!subject) return

  // 1. Kirim Email (Dinamis dari Platform Settings)
  if (settings.SMTP_HOST && settings.SMTP_USER) {
    try {
      const transporter = nodemailer.createTransport({
        host: settings.SMTP_HOST,
        port: Number(settings.SMTP_PORT) || 587,
        auth: { user: settings.SMTP_USER, pass: settings.SMTP_PASS },
      })
      await transporter.sendMail({
        from: `"${platformName}" <${settings.SMTP_FROM || settings.SMTP_USER}>`,
        to: app.adminEmail,
        subject,
        html: `<div style="font-family: sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #4f46e5;">${platformName}</h2>
                <p>${message.replace(/\n/g, '<br>')}</p>
              </div>`
      })
    } catch (err) {
      logger.error("Email notification failed", err)
    }
  }

  // 2. Kirim WhatsApp (Dinamis dari Platform Settings)
  if (settings.STARSENDER_API_KEY) {
    try {
      await fetch("https://api.starsender.online/api/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${settings.STARSENDER_API_KEY}`,
        },
        body: JSON.stringify({
          messageType: "text",
          to: app.adminPhone,
          body: `*${subject}*\n\n${message}`
        }),
      })
    } catch (err) {
      logger.error("WA notification failed", err)
    }
  }
}

/**
 * Mengirim notifikasi WA ke Super Admin dan Marketer/Affiliasi ketika ada pendaftaran baru
 */
export async function sendNewApplicationAlerts(applicationId: string, affiliateId?: string | null) {
  const app = await db.tenantApplication.findUnique({ where: { id: applicationId } })
  if (!app) return

  const settings = await getPlatformSettings()
  const apiKey = settings.STARSENDER_API_KEY
  if (!apiKey) return // Tidak bisa kirim WA jika API Key kosong

  const sendWa = async (to: string, message: string) => {
    try {
      await fetch("https://api.starsender.online/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ messageType: "text", to, body: message }),
      })
    } catch (err) {
      logger.error("WA alert failed", err)
    }
  }

  // 1. Alert ke Super Admin
  const superAdmins = await db.user.findMany({ where: { isSuperAdmin: true, isActive: true } })
  const defaultAdminMsg = `*PENDAFTARAN SEKOLAH BARU*\n\nSekolah: {{schoolName}}\nAdmin: {{adminName}}\nWA: {{adminPhone}}\nSubdomain: {{schoolSlug}}.schoolpro.id\n\nSilakan cek di Panel Super Admin untuk meninjau pengajuan ini.`
  const adminMsg = (settings.WA_TEMPLATE_ALERT_SUPERADMIN || defaultAdminMsg)
    .replace(/{{schoolName}}/g, app.schoolName)
    .replace(/{{adminName}}/g, app.adminName)
    .replace(/{{adminPhone}}/g, app.adminPhone)
    .replace(/{{schoolSlug}}/g, app.schoolSlug)
  
  for (const admin of superAdmins) {
    if (admin.phone) await sendWa(admin.phone, adminMsg)
  }

  // 2. Alert ke Marketer (Jika menggunakan kode referral)
  if (affiliateId) {
    const affiliate = await db.affiliateProfile.findUnique({
      where: { id: affiliateId },
      include: { user: true }
    })
    
    if (affiliate && affiliate.user.phone) {
      const defaultAffiliateMsg = `*LEAD SEKOLAH BARU! 🎉*\n\nHalo {{affiliateName}},\nKabar baik! Pendaftaran sekolah baru telah masuk menggunakan kode referral Anda ({{referralCode}}).\n\nSekolah: {{schoolName}}\nStatus: PENDING (Menunggu Review)\n\nSilakan pantau perkembangan lead Anda di Dashboard Mitra Afiliasi.`
      const affiliateMsg = (settings.WA_TEMPLATE_ALERT_AFFILIATE || defaultAffiliateMsg)
        .replace(/{{affiliateName}}/g, affiliate.user.name)
        .replace(/{{referralCode}}/g, affiliate.referralCode)
        .replace(/{{schoolName}}/g, app.schoolName)
      await sendWa(affiliate.user.phone, affiliateMsg)
    }
  }
}

/**
 * Logika menyetujui pengajuan dan membuat tenant baru
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
      }
    }
  })

  // 2. Cek apakah user admin sudah ada
  let user = await db.user.findUnique({ where: { email: app.adminEmail } })
  
  // Generate random temporary password
  const tempPassword = crypto.randomBytes(8).toString("base64url")

  if (!user) {
    // Buat user baru dengan password random yang di-hash
    const hashedPassword = await bcrypt.hash(tempPassword, 12)
    user = await db.user.create({
      data: {
        name: app.adminName,
        email: app.adminEmail,
        password: hashedPassword,
        phone: app.adminPhone,
      }
    })
  }

  // 3. Hubungkan User ke Tenant sebagai Owner
  await db.tenantUser.create({
    data: {
      tenantId: tenant.id,
      userId: user.id,
      role: "owner"
    }
  })

  // 4. Update status pengajuan + simpan temp password untuk notifikasi
  await db.tenantApplication.update({
    where: { id },
    data: {
      status: "APPROVED",
      adminMessage: `temp_pwd:${tempPassword}`,
    }
  })

  // 5. Kirim Notifikasi (akan membaca tempPassword dari adminMessage)
  await sendApplicationNotification(id)

  // 6. Hapus temp password dari record setelah notifikasi terkirim
  await db.tenantApplication.update({
    where: { id },
    data: { adminMessage: null }
  })

  return tenant
}

