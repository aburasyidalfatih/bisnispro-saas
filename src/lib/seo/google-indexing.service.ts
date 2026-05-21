import { JWT } from "google-auth-library"
import { logger } from "@/lib/logger"
import { db } from "@/lib/db"

/**
 * Service untuk memanggil Google Indexing API
 * Secara paksa meminta Google untuk mengindeks atau memperbarui halaman yang dikirim.
 */
export async function submitToGoogleIndexing(
  url: string, 
  type: "URL_UPDATED" | "URL_DELETED" = "URL_UPDATED",
  credentials?: { email: string, key: string }
): Promise<boolean> {
  // Gunakan kredensial tenant jika ada, atau fallback ke kredensial global server
  let clientEmail = credentials?.email || process.env.GOOGLE_INDEXING_CLIENT_EMAIL
  let privateKey = credentials?.key || process.env.GOOGLE_INDEXING_PRIVATE_KEY

  if (!clientEmail || !privateKey) {
    try {
      const settings = await db.platformSetting.findMany({
        where: { key: { in: ["GOOGLE_INDEXING_CLIENT_EMAIL", "GOOGLE_INDEXING_PRIVATE_KEY"] } }
      })
      const emailSetting = settings.find(s => s.key === "GOOGLE_INDEXING_CLIENT_EMAIL")?.value
      const keySetting = settings.find(s => s.key === "GOOGLE_INDEXING_PRIVATE_KEY")?.value
      clientEmail = clientEmail || emailSetting
      privateKey = privateKey || keySetting
    } catch (e) {
      logger.warn("Failed to fetch Google Indexing credentials from DB", { error: String(e) })
    }
  }
  
  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n')
  }

  if (!clientEmail || !privateKey) {
    logger.warn("Google Indexing API credentials not found (tenant/global). Skipping indexing for: " + url)
    return false
  }

  try {
    const jwtClient = new JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/indexing"],
    })

    const tokens = await jwtClient.authorize()
    const endpoint = "https://indexing.googleapis.com/v3/urlNotifications:publish"

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${tokens.access_token}`,
      },
      body: JSON.stringify({
        url,
        type,
      }),
    })

    if (response.ok) {
      logger.info(`Successfully submitted to Google Indexing API: ${url} (${type})`)
      return true
    } else {
      const errorData = await response.text()
      logger.error("Google Indexing API error", { 
        status: response.status, 
        error: errorData,
        url 
      })
      return false
    }
  } catch (error) {
    logger.error("Error connecting to Google Indexing API", { error: String(error) })
    return false
  }
}
