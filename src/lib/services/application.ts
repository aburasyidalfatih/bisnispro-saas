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
      subject = `Pendaftaran ${app.schoolName} Berhasil Diterima`
      message = `Halo ${app.adminName},\n\nSelamat! Formulir pendaftaran sekolah ${app.schoolName} telah kami terima dan saat ini sudah masuk ke dalam antrean peninjauan tim kami.\n\nKami akan segera menghubungi Anda kembali setelah proses verifikasi selesai.\n\nTerima kasih.`
      break
    case "APPROVED":
      const tempPwd = app.adminMessage?.startsWith("temp_pwd:") ? app.adminMessage.replace("temp_pwd:", "") : "Hubungi admin untuk mendapatkan password"
      subject = `Selamat! Pendaftaran ${app.schoolName} Disetujui`
      message = `Halo ${app.adminName},\n\nPendaftaran sekolah ${app.schoolName} telah disetujui. Anda sekarang dapat mengakses dashboard sekolah menggunakan kredensial berikut:\n\nURL Login: https://${app.schoolSlug}.${settings.NEXT_PUBLIC_ROOT_DOMAIN || 'schoolpro.id'}/login\nEmail: ${app.adminEmail}\nPassword Sementara: ${tempPwd}\n\n⚠️ PENTING: Harap segera mengganti password Anda setelah berhasil login pertama kali demi keamanan akun Anda.\n\nTerima kasih.`
      break
    case "REVISION":
      subject = `Permintaan Revisi Pendaftaran: ${app.schoolName}`
      message = `Halo ${app.adminName},\n\nTerima kasih telah mendaftar. Namun, ada beberapa data yang perlu diperbaiki:\n\n"${app.adminMessage}"\n\nSilakan hubungi kami untuk melakukan perbaikan data.`
      break
    case "REJECTED":
      subject = `Update Pendaftaran: ${app.schoolName}`
      message = `Halo ${app.adminName},\n\nMohon maaf, pendaftaran sekolah ${app.schoolName} belum dapat kami setujui saat ini.\n\nAlasan: ${app.adminMessage}\n\nTerima kasih atas minat Anda.`
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
  const adminMsg = `*PENDAFTARAN SEKOLAH BARU*\n\nSekolah: ${app.schoolName}\nAdmin: ${app.adminName}\nWA: ${app.adminPhone}\nSubdomain: ${app.schoolSlug}.schoolpro.id\n\nSilakan cek di Panel Super Admin untuk meninjau pengajuan ini.`
  
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
      const affiliateMsg = `*LEAD SEKOLAH BARU! 🎉*\n\nHalo ${affiliate.user.name},\nKabar baik! Pendaftaran sekolah baru telah masuk menggunakan kode referral Anda (${affiliate.referralCode}).\n\nSekolah: ${app.schoolName}\nStatus: PENDING (Menunggu Review)\n\nSilakan pantau perkembangan lead Anda di Dashboard Mitra Afiliasi.`
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

