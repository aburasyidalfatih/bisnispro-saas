import { JWT } from "google-auth-library"
import { logger } from "@/lib/logger"

/**
 * Service untuk memanggil Google Indexing API
 * Secara paksa meminta Google untuk mengindeks atau memperbarui halaman yang dikirim.
 */
export async function submitToGoogleIndexing(url: string, type: "URL_UPDATED" | "URL_DELETED" = "URL_UPDATED"): Promise<boolean> {
  // Untuk menjalankan fungsi ini, butuh variabel env GOOGLE_INDEXING_CLIENT_EMAIL dan GOOGLE_INDEXING_PRIVATE_KEY
  const clientEmail = process.env.GOOGLE_INDEXING_CLIENT_EMAIL
  const privateKey = process.env.GOOGLE_INDEXING_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!clientEmail || !privateKey) {
    logger.warn("Google Indexing API credentials not found. Skipping indexing for: " + url)
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
