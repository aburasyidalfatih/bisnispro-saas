import { logger } from "@/lib/logger"

// Gunakan key statis untuk seluruh network SchoolPro
export const INDEXNOW_KEY = "schoolpro-indexnow-secret-key-2026"

/**
 * Submit URLs to IndexNow (Bing, Yandex, Seznam)
 * @param host Hostname dari website (contoh: sekolahanda.sch.id atau smpn1.schoolpro.id)
 * @param urls Array of URLs to index (contoh: ["https://sekolahanda.sch.id/berita/123"])
 */
export async function submitToIndexNow(host: string, urls: string[]): Promise<boolean> {
  if (process.env.NODE_ENV !== "production") {
    logger.info("Skipping IndexNow submit in development mode", { host, urls })
    return true
  }

  try {
    const response = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        host,
        key: INDEXNOW_KEY,
        keyLocation: `https://${host}/${INDEXNOW_KEY}.txt`,
        urlList: urls,
      }),
    })

    if (response.ok) {
      logger.info("Successfully submitted URLs to IndexNow", { host, urlCount: urls.length })
      return true
    } else {
      logger.error("Failed to submit to IndexNow", { 
        status: response.status, 
        statusText: response.statusText,
        host 
      })
      return false
    }
  } catch (error) {
    logger.error("Error submitting to IndexNow", { error: String(error) })
    return false
  }
}
