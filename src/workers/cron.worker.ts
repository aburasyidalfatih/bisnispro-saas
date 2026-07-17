import { runWithLock, emailQueue, waQueue } from "./shared"
import { syncPostViewsToDatabase, syncEventViewsToDatabase } from "@/features/post/services/views.service"
import { syncShareCountsToDatabase } from "@/features/post/services/share.service"
import { processLeaderboardSync } from "@/features/gamification/services/leaderboard.service"
import { approveApplication } from "@/features/tenant/services/application.service"
import { getWaQueueDelay } from "@/features/notification/services/wa-queue.service"
import { db } from "@/lib/db"

export function initCronJobs() {
  runWithLock("syncViews", 10 * 60 * 1000, async () => {
    try {
      const p = await syncPostViewsToDatabase()
      const e = await syncEventViewsToDatabase()
      const s = await syncShareCountsToDatabase()
      if (p > 0 || e > 0 || s > 0) {
        console.log(`[cron] Synced ${p} post views, ${e} event views, ${s} share counts to DB`)
      }
    } catch (error) {
      console.error("[cron] Failed to sync", error)
    }
  }) // 10 minutes

  runWithLock("errorLogCleanup", 24 * 60 * 60 * 1000, async () => {
    console.log("[cron] Running Error Log Cleanup...")
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const result = await db.errorLog.deleteMany({
        where: {
          createdAt: { lt: thirtyDaysAgo }
        }
      })
      if (result.count > 0) {
        console.log(`[cron] Cleaned up ${result.count} old error logs.`)
      }
    } catch (error) {
      console.error("[cron] Failed Error Log Cleanup", error)
    }
  }) // Runs every 24 hours

  runWithLock("autoApproveApps", 30 * 60 * 1000, async () => {
    try {
      const setting = await db.platformSetting.findUnique({
        where: { key: 'AUTO_APPROVE_APPLICATIONS_24H' }
      })
      
      if (setting?.value === "true") {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        
        const pendingApps = await db.tenantApplication.findMany({
          where: {
            status: "PENDING",
            createdAt: {
              lte: twentyFourHoursAgo
            }
          },
          take: 10 // process in small batches to avoid overload
        })
        
        if (pendingApps.length > 0) {
          console.log(`[cron] Auto-approving ${pendingApps.length} pending applications (older than 24h)...`)
          
          for (const app of pendingApps) {
            try {
              await approveApplication(app.id)
              console.log(`[cron] Successfully auto-approved application ${app.id}`)
            } catch (err) {
              console.error(`[cron] Failed to auto-approve application ${app.id}:`, err)
            }
          }
        }
      }
    } catch (error) {
      console.error("[cron] Failed Auto-Approve Application check", error)
    }
  }) // Runs every 30 minutes

  runWithLock("leaderboardSync", 3 * 60 * 60 * 1000, async () => {
    console.log("[cron] Running Leaderboard Sync...")
    try {
      const result = await processLeaderboardSync()
      console.log(`[cron] Leaderboard sync success: ${result.message} (${result.processedCount} tenants)`)
    } catch (error) {
      console.error("[cron] Failed to sync leaderboard", error)
    }
  }) // 3 hours

  runWithLock("tenantLifecycle", 6 * 60 * 60 * 1000, async () => {
    console.log("[cron] Running Tenant Lifecycle Management check...")
    try {
      const now = new Date()
      
      // Fetch all retention settings once
      const retentionKeys = [
        'RETENTION_30_EMAIL_SUBJECT', 'RETENTION_30_EMAIL_BODY', 'RETENTION_30_WA',
        'RETENTION_60_EMAIL_SUBJECT', 'RETENTION_60_EMAIL_BODY', 'RETENTION_60_WA',
        'RETENTION_90_EMAIL_SUBJECT', 'RETENTION_90_EMAIL_BODY', 'RETENTION_90_WA'
      ]
      const platformSettings = await db.platformSetting.findMany({
        where: { key: { in: retentionKeys } }
      })
      const settingsMap = platformSettings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {} as any)

      // 1. Fase 1: Peringatan 30 Hari (Re-engagement)
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      
      const warnTenants = await db.tenant.findMany({
        where: {
          isActive: true,
          retentionStatus: "ACTIVE",
          lastActiveAt: {
            lte: thirtyDaysAgo
          }
        },
        take: 100
      })

      for (const tenant of warnTenants) {
        console.log(`[retention] Warning 30-day inactive tenant: ${tenant.slug}`)
        
        await db.tenant.update({
          where: { id: tenant.id },
          data: { retentionStatus: "WARN_30" }
        })

        const emailSubject = settingsMap['RETENTION_30_EMAIL_SUBJECT'] || "Apakah ada kendala dengan website sekolah Anda?"
        const emailBodyRaw = settingsMap['RETENTION_30_EMAIL_BODY'] || `<p>Halo Admin {nama_sekolah},</p><p>Kami perhatikan Anda belum login ke dasbor SchoolPro selama 30 hari. Apakah ada kendala dalam mengatur website atau fitur sekolah Anda?</p><p>Silakan login kembali menggunakan email pendaftaran Anda yaitu <strong>{email_pendaftaran}</strong> beserta password yang sudah Anda buat saat mendaftar. Jika Anda lupa password, silakan gunakan fitur "Lupa Password" di halaman login untuk membuat password baru.</p><p>Yuk, mulai bangun kehadiran digital sekolah Anda sekarang. Jika butuh bantuan teknis, jangan sungkan membalas email ini!</p><p>Jangan lupa juga untuk bergabung di <strong>Grup Support WhatsApp SchoolPro</strong> untuk mendapatkan bantuan cepat dari tim kami dan update terbaru melalui tautan ini: <a href="https://chat.whatsapp.com/FtA3asfD4bcGpGyPXJgcg4">https://chat.whatsapp.com/FtA3asfD4bcGpGyPXJgcg4</a></p>`
        const emailBody = emailBodyRaw.replace(/{nama_sekolah}/g, tenant.name).replace(/{email_pendaftaran}/g, tenant.email || "")
        
        const waMsgRaw = settingsMap['RETENTION_30_WA'] || "Halo Admin {nama_sekolah}, kami perhatikan Anda belum login dasbor selama 30 hari. Apakah ada kendala?\n\nSilakan login kembali menggunakan email pendaftaran Anda yaitu {email_pendaftaran} beserta password yang sudah Anda buat saat mendaftar. Jika lupa password, gunakan fitur Lupa Password di halaman login.\n\nYuk, bangun kehadiran digital sekolah Anda sekarang. Balas pesan ini jika butuh bantuan!\n\nJangan lupa bergabung di Grup Support WhatsApp SchoolPro untuk mendapatkan bantuan cepat dan update terbaru: https://chat.whatsapp.com/FtA3asfD4bcGpGyPXJgcg4"
        const waMsg = waMsgRaw.replace(/{nama_sekolah}/g, tenant.name).replace(/{email_pendaftaran}/g, tenant.email || "")

        if (tenant.email) {
          await emailQueue.add("retention-warning", {
            tenantId: tenant.id,
            to: tenant.email,
            subject: emailSubject,
            htmlContent: emailBody
          })
        }

        if (tenant.whatsapp || tenant.phone) {
          const phone = tenant.whatsapp || tenant.phone || ""
          const waLog = await db.waQueueLog.create({
            data: {
              tenantId: tenant.id, 
              targetNumber: phone,
              message: waMsg,
              status: "PENDING"
            }
          })
          const delay = await getWaQueueDelay(tenant.id)
          await waQueue.add("retention-warning-wa", {
            tenantId: tenant.id,
            number: phone,
            message: waMsg,
            waQueueLogId: waLog.id
          }, { delay })
        }
      }

      // 2. Fase 2: Penonaktifan 60 Hari (Suspension)
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
      const suspendTenants = await db.tenant.findMany({
        where: {
          isActive: true,
          retentionStatus: "WARN_30",
          lastActiveAt: { lte: sixtyDaysAgo }
        },
        take: 100
      })

      for (const tenant of suspendTenants) {
        console.log(`[retention] Suspending 60-day inactive tenant: ${tenant.slug}`)
        await db.tenant.update({
          where: { id: tenant.id },
          data: { 
            isActive: false, 
            retentionStatus: "SUSPENDED_60" 
          }
        })

        const emailSubject = settingsMap['RETENTION_60_EMAIL_SUBJECT'] || "PEMBERITAHUAN: Website Sekolah Anda Ditangguhkan (Suspend)"
        const emailBodyRaw = settingsMap['RETENTION_60_EMAIL_BODY'] || `<p>Halo Admin {nama_sekolah},</p><p>Kami ingin memberitahukan bahwa website sekolah Anda saat ini telah <strong>ditangguhkan (suspend)</strong> karena tidak ada aktivitas login selama 60 hari terakhir.</p><p>Untuk mengaktifkan kembali website Anda, silakan segera menghubungi tim Admin SchoolPro. Jika tidak ada konfirmasi lebih lanjut, data website Anda akan dihapus secara permanen pada hari ke-90.</p><p>Jika Anda butuh bantuan, bergabunglah di <strong>Grup Support WhatsApp SchoolPro</strong>: <a href="https://chat.whatsapp.com/FtA3asfD4bcGpGyPXJgcg4">https://chat.whatsapp.com/FtA3asfD4bcGpGyPXJgcg4</a></p>`
        const emailBody = emailBodyRaw.replace(/{nama_sekolah}/g, tenant.name)
        
        const waMsgRaw = settingsMap['RETENTION_60_WA'] || "Halo Admin {nama_sekolah}, website sekolah Anda saat ini berstatus SUSPEND (ditangguhkan) karena tidak ada aktivitas login selama 60 hari. Silakan hubungi admin SchoolPro jika ingin mengaktifkan kembali website Anda sebelum dihapus permanen.\n\nGrup Support WhatsApp SchoolPro: https://chat.whatsapp.com/FtA3asfD4bcGpGyPXJgcg4"
        const waMsg = waMsgRaw.replace(/{nama_sekolah}/g, tenant.name)

        if (tenant.email) {
          await emailQueue.add("retention-suspend", {
            tenantId: tenant.id, to: tenant.email, subject: emailSubject, htmlContent: emailBody
          })
        }

        if (tenant.whatsapp || tenant.phone) {
          const phone = tenant.whatsapp || tenant.phone || ""
          const waLog = await db.waQueueLog.create({
            data: { tenantId: tenant.id, targetNumber: phone, message: waMsg, status: "PENDING" }
          })
          const delay = await getWaQueueDelay(tenant.id)
          await waQueue.add("retention-suspend-wa", {
            tenantId: tenant.id, number: phone, message: waMsg, waQueueLogId: waLog.id
          }, { delay })
        }
      }

      // 3. Fase 3: Penghapusan 90 Hari (Hard Delete)
      const ninetyDaysAgoDelete = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      const deleteTenants = await db.tenant.findMany({
        where: {
          isActive: false,
          retentionStatus: "SUSPENDED_60",
          lastActiveAt: { lte: ninetyDaysAgoDelete },
          deletedAt: null
        },
        take: 100
      })

      for (const tenant of deleteTenants) {
        console.log(`[retention] Hard-deleting 90-day inactive tenant: ${tenant.slug}`)
        
        const emailSubject = settingsMap['RETENTION_90_EMAIL_SUBJECT'] || "PEMBERITAHUAN: Website Sekolah Anda Telah Dihapus Permanen"
        const emailBodyRaw = settingsMap['RETENTION_90_EMAIL_BODY'] || `<p>Halo Admin {nama_sekolah},</p><p>Karena tidak ada aktivitas login selama 90 hari dan masa penangguhan telah berakhir, dengan berat hati kami menginformasikan bahwa data website sekolah Anda telah <strong>dihapus secara total</strong> dari sistem kami untuk menjaga performa server.</p><p>Jika di kemudian hari Anda ingin memiliki website kembali, silakan melakukan pengajuan pendaftaran ulang. Terima kasih atas ketertarikan Anda pada SchoolPro.</p><p>Tetap terhubung bersama kami di <strong>Grup Support WhatsApp SchoolPro</strong>: <a href="https://chat.whatsapp.com/FtA3asfD4bcGpGyPXJgcg4">https://chat.whatsapp.com/FtA3asfD4bcGpGyPXJgcg4</a></p>`
        const emailBody = emailBodyRaw.replace(/{nama_sekolah}/g, tenant.name)
        
        const waMsgRaw = settingsMap['RETENTION_90_WA'] || "Halo Admin {nama_sekolah}, website sekolah Anda telah DIHAPUS TOTAL dari sistem karena tidak ada aktivitas selama 90 hari. Jika di kemudian hari Anda membutuhkan website kembali, silakan ajukan pendaftaran ulang. Terima kasih.\n\nGrup Support WhatsApp SchoolPro: https://chat.whatsapp.com/FtA3asfD4bcGpGyPXJgcg4"
        const waMsg = waMsgRaw.replace(/{nama_sekolah}/g, tenant.name)

        if (tenant.email) {
          await emailQueue.add("retention-delete", {
            tenantId: tenant.id, to: tenant.email, subject: emailSubject, htmlContent: emailBody
          })
        }

        if (tenant.whatsapp || tenant.phone) {
          const phone = tenant.whatsapp || tenant.phone || ""
          const waLog = await db.waQueueLog.create({
            data: { tenantId: tenant.id, targetNumber: phone, message: waMsg, status: "PENDING" }
          })
          const delay = await getWaQueueDelay(tenant.id)
          await waQueue.add("retention-delete-wa", {
            tenantId: tenant.id, number: phone, message: waMsg, waQueueLogId: waLog.id
          }, { delay })
        }

        await db.tenant.update({
          where: { id: tenant.id },
          data: {
            isActive: false,
            retentionStatus: "CHURNED",
            deletedAt: new Date()
          }
        })
      }

    } catch (error) {
      console.error("[cron] Failed Tenant Lifecycle check", error)
    }
  }) // Runs once every 6 hours

  runWithLock("emailQueueSync", 5 * 60 * 1000, async () => {
    console.log("[cron] Running Email Queue Process...")
    try {
      const { processEmailQueueCron } = await import("@/features/notification/services/notification.service")
      const result = await processEmailQueueCron()
      if (result.processed && result.processed > 0) {
        console.log(`[cron] Email Queue processed: ${result.processed}, success: ${result.successCount}, fail: ${result.failCount}`)
      }
    } catch (error) {
      console.error("[cron] Failed to process email queue", error)
    }
  }) // Runs every 5 minutes
}
