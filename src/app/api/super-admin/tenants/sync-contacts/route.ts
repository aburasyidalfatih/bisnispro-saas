import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { google } from "googleapis"
import { logger } from "@/lib/logger"

// Helper function to extract Google Contacts credentials
async function getGoogleCredentials() {
  const settings = await db.platformSetting.findMany({
    where: {
      key: {
        in: [
          "GOOGLE_CONTACTS_CLIENT_ID",
          "GOOGLE_CONTACTS_CLIENT_SECRET",
          "GOOGLE_CONTACTS_REFRESH_TOKEN",
        ],
      },
    },
  })
  
  const map: Record<string, string> = {}
  settings.forEach((s) => {
    if (s.value) map[s.key] = s.value
  })
  
  return {
    clientId: map.GOOGLE_CONTACTS_CLIENT_ID,
    clientSecret: map.GOOGLE_CONTACTS_CLIENT_SECRET,
    refreshToken: map.GOOGLE_CONTACTS_REFRESH_TOKEN,
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.isSuperAdmin) {
      return new NextResponse("Unauthorized", { status: 403 })
    }

    const { clientId, clientSecret, refreshToken } = await getGoogleCredentials()

    if (!clientId || !clientSecret || !refreshToken) {
      return NextResponse.json(
        { error: "Kredensial Google Contacts belum dikonfigurasi di Pengaturan Super Admin." },
        { status: 400 }
      )
    }

    // Initialize Google Auth
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret)
    oauth2Client.setCredentials({ refresh_token: refreshToken })

    const people = google.people({ version: "v1", auth: oauth2Client })

    // Dapatkan semua tenant yang punya nomor telepon/whatsapp dan aktif
    const tenants = await db.tenant.findMany({
      where: {
        isActive: true,
        OR: [{ phone: { not: null } }, { whatsapp: { not: null } }],
      },
      select: {
        id: true,
        name: true,
        phone: true,
        whatsapp: true,
        email: true,
        settings: true,
      },
    })

    // Mulai proses background sync (fire and forget) agar tidak timeout untuk 800+ tenant
    processSyncBackground(tenants, people).catch(err => console.error("Sync Background Error:", err))

    return NextResponse.json({ 
      success: true, 
      message: `Proses sinkronisasi ${tenants.length} kontak telah dimulai di latar belakang. Proses ini mungkin memakan waktu beberapa menit.` 
    })
  } catch (error: any) {
    console.error("[SYNC_CONTACTS]", error)
    return NextResponse.json({ error: "Terjadi kesalahan server saat memulai sinkronisasi" }, { status: 500 })
  }
}

// Background Processor
async function processSyncBackground(tenants: any[], people: any) {
  let successCount = 0
  let skipCount = 0
  
  for (const tenant of tenants) {
    try {
      // Parse settings JSON
      let settingsObj: any = typeof tenant.settings === "string" ? JSON.parse(tenant.settings) : tenant.settings || {}
      
      // Jika sudah ada googleContactId, lewati (menghindari duplikat)
      if (settingsObj.googleContactId) {
        skipCount++
        continue
      }

      const phoneNumber = tenant.whatsapp || tenant.phone
      if (!phoneNumber) continue

      // Create contact payload
      const requestBody: any = {
        names: [
          {
            givenName: `Admin ${tenant.name}`,
            displayName: `Admin ${tenant.name}`,
          },
        ],
        phoneNumbers: [
          {
            value: phoneNumber,
            type: "work",
          },
        ],
      }

      if (tenant.email) {
        requestBody.emailAddresses = [
          {
            value: tenant.email,
            type: "work",
          },
        ]
      }

      // Memanggil Google People API
      const response = await people.people.createContact({
        requestBody,
      })

      const resourceName = response.data.resourceName

      // Simpan ID kontak ke DB agar tidak disinkronkan dua kali
      settingsObj.googleContactId = resourceName
      await db.tenant.update({
        where: { id: tenant.id },
        data: { settings: JSON.stringify(settingsObj) },
      })

      successCount++

      // Jeda 500ms untuk menghindari rate limit Google API (Quota)
      await new Promise(res => setTimeout(res, 500))

    } catch (error: any) {
      console.error(`Gagal sinkronisasi tenant ${tenant.name}:`, error?.response?.data || error.message)
      // Jeda 2 detik jika terkena rate limit sebelum lanjut
      if (error?.response?.status === 429) {
        await new Promise(res => setTimeout(res, 2000))
      }
    }
  }

  logger.info(`[SYNC COMPLETE] Sukses: ${successCount}, Dilewati (Sudah ada): ${skipCount}`)
}
