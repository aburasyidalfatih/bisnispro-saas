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
  let waEnabled = true;
  let emailEnabled = true;
  
  let wavioTemplateName = ""
  let wavioVariables: Record<string, string> = {}

  switch (app.status) {
    case "PENDING": {
      waEnabled = settings.WA_ENABLE_PENDING !== "false";
      emailEnabled = settings.EMAIL_ENABLE_PENDING !== "false";
      subject = settings.WA_SUBJECT_PENDING || `Pendaftaran ${app.schoolName} Berhasil Diterima`
      const tpl =
        settings.WA_TEMPLATE_PENDING ||
        `Halo {{adminName}},\n\nSelamat! Formulir pendaftaran sekolah {{schoolName}} telah kami terima dan saat ini sudah masuk ke dalam antrean peninjauan tim kami.\n\nKami akan segera menghubungi Anda kembali setelah proses verifikasi selesai.\n\nTerima kasih.`
      message = tpl
        .replace(/{{adminName}}/g, app.adminName)
        .replace(/{{schoolName}}/g, app.schoolName)
        
      wavioTemplateName = settings.WAVIO_TEMPLATE_PENDING || "school_registration_pending"
      wavioVariables = {
        "1": app.adminName,
        "2": app.schoolName
      }
      break
    }
    case "APPROVED": {
      waEnabled = settings.WA_ENABLE_APPROVED !== "false";
      emailEnabled = settings.EMAIL_ENABLE_APPROVED !== "false";
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
        
      wavioTemplateName = settings.WAVIO_TEMPLATE_APPROVED || "school_registration_approved"
      wavioVariables = {
        "1": app.adminName,
        "2": app.schoolName,
        "3": loginUrl,
        "4": app.adminEmail,
        "5": tempPwd
      }
      break
    }
    case "REVISION": {
      waEnabled = settings.WA_ENABLE_REVISION !== "false";
      emailEnabled = settings.EMAIL_ENABLE_REVISION !== "false";
      subject = settings.WA_SUBJECT_REVISION || `Permintaan Revisi Pendaftaran: ${app.schoolName}`
      const revisionUrl = `https://${rootDomain}/revisi-pengajuan/${app.id}`
      const tpl =
        settings.WA_TEMPLATE_REVISION ||
        `Halo {{adminName}},\n\nTerima kasih telah mendaftar. Namun, ada beberapa data yang perlu diperbaiki:\n\n"{{adminMessage}}"\n\nSilakan klik disini untuk melengkapi data: {{revisionUrl}}`
      message = tpl
        .replace(/{{adminName}}/g, app.adminName)
        .replace(/{{adminMessage}}/g, app.adminMessage || "")
        .replace(/{{revisionUrl}}/g, revisionUrl)
        
      wavioTemplateName = settings.WAVIO_TEMPLATE_REVISION || "school_registration_revision"
      wavioVariables = {
        "1": app.adminName,
        "2": app.adminMessage || "",
        "3": revisionUrl
      }
      break
    }
    case "REJECTED": {
      waEnabled = settings.WA_ENABLE_REJECTED !== "false";
      emailEnabled = settings.EMAIL_ENABLE_REJECTED !== "false";
      subject = settings.WA_SUBJECT_REJECTED || `Update Pendaftaran: ${app.schoolName}`
      const tpl =
        settings.WA_TEMPLATE_REJECTED ||
        `Halo {{adminName}},\n\nMohon maaf, pendaftaran sekolah {{schoolName}} belum dapat kami setujui saat ini.\n\nAlasan: {{adminMessage}}\n\nTerima kasih atas minat Anda.`
      message = tpl
        .replace(/{{adminName}}/g, app.adminName)
        .replace(/{{schoolName}}/g, app.schoolName)
        .replace(/{{adminMessage}}/g, app.adminMessage || "")
        
      wavioTemplateName = settings.WAVIO_TEMPLATE_REJECTED || "school_registration_rejected"
      wavioVariables = {
        "1": app.adminName,
        "2": app.schoolName,
        "3": app.adminMessage || ""
      }
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

  if (emailEnabled) {
    await sendEmail(app.adminEmail, subject, emailHtml)
      .then(() => logger.info("Application email sent", { applicationId, status: app.status }))
      .catch((err) => logger.error("Application email failed", err, { applicationId }))
  } else {
    logger.info("Application email skipped via settings", { applicationId })
  }

  // 2. Kirim WhatsApp ke pendaftar (menggunakan helper terpusat)
  const disableWa = settings.DISABLE_WA_NOTIFICATION === "true" || process.env.DISABLE_WA_NOTIFICATION === "true"
  if (!disableWa && waEnabled && app.adminPhone) {
    const result = await sendWhatsApp(
      app.adminPhone, 
      `*${subject}*\n\n${message}`,
      undefined, // no tenantId for platform admin
      wavioTemplateName ? { name: wavioTemplateName, variables: wavioVariables } : undefined
    )
    if (!result.success) {
      logger.warn("Application WA notification skipped", { applicationId, error: result.error })
    } else {
      logger.info("Application WA sent", { applicationId, status: app.status })
    }
  } else if (disableWa || !waEnabled) {
    logger.info("WhatsApp notification disabled globally or via template setting", { applicationId })
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

  const waEnabledSuperAdmin = settings.WA_ENABLE_ALERT_SUPERADMIN !== "false";
  const emailEnabledSuperAdmin = settings.EMAIL_ENABLE_ALERT_SUPERADMIN !== "false";
  const wavioTplSuperadmin = settings.WAVIO_TEMPLATE_ALERT_SUPERADMIN || "superadmin_alert_new_school"
  const wavioVarsSuperadmin = {
    "1": app.schoolName,
    "2": app.adminPhone
  }

  for (const admin of superAdmins) {
    if (admin.phone && waEnabledSuperAdmin) {
      await sendWhatsApp(admin.phone, adminMsg, undefined, { name: wavioTplSuperadmin, variables: wavioVarsSuperadmin })
    } else if (admin.phone && !waEnabledSuperAdmin) {
      logger.info("Super Admin WA alert skipped via settings")
    } else {
      logger.warn("Super Admin has no phone number — alert skipped", { adminId: admin.id })
    }
    if (admin.email && emailEnabledSuperAdmin) {
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
    } else if (admin.email && !emailEnabledSuperAdmin) {
      logger.info("Super Admin email alert skipped via settings")
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

    const waEnabledAffiliate = settings.WA_ENABLE_ALERT_AFFILIATE !== "false";
    const emailEnabledAffiliate = settings.EMAIL_ENABLE_ALERT_AFFILIATE !== "false";

    const wavioTplAffiliate = settings.WAVIO_TEMPLATE_ALERT_AFFILIATE || "affiliate_alert_new_lead"
    const wavioVarsAffiliate = {
      "1": affiliate.user.name || "Mitra",
      "2": app.schoolName,
      "3": affiliate.referralCode
    }

    if (affiliate.user.phone && waEnabledAffiliate) {
      await sendWhatsApp(affiliate.user.phone, affiliateMsg, undefined, { name: wavioTplAffiliate, variables: wavioVarsAffiliate })
    } else if (affiliate.user.phone && !waEnabledAffiliate) {
      logger.info("Affiliate WA alert skipped via settings")
    } else {
      logger.warn("Affiliate has no phone number — alert skipped", { affiliateId })
    }

    if (affiliate.user.email && emailEnabledAffiliate) {
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
    } else if (affiliate.user.email && !emailEnabledAffiliate) {
      logger.info("Affiliate email alert skipped via settings")
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
        aiTokens: freePlan?.monthlyAiTokens || 0, // Bonus token awal untuk Free
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

  // Invalidate public tenant cache
  try {
    const { invalidatePublicTenantCache } = await import("@/features/tenant/services/tenant-public.service")
    await invalidatePublicTenantCache(tenant.slug)
  } catch {}

  return tenant
}
