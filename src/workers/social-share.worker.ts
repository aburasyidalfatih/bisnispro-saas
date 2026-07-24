import { Worker, Job } from "bullmq"
import { connection, applyEnterpriseHandling } from "./shared"
import { db } from "@/lib/db"
import { SocialShareService } from "@/features/social/services/social-share.service"

export const socialShareWorker = new Worker(
  "social-share-queue",
  async (job: Job) => {
    const { tenantId, postId } = job.data
    console.log(`[social-share-queue] Processing share for post ${postId} (tenant ${tenantId})...`)

    try {
      const post = await db.post.findUnique({
        where: { id: postId },
        include: { tenant: true }
      })
      if (!post) throw new Error("Post not found")

      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "bisnispro.id"
      const host = post.tenant.domain || `${post.tenant.slug}.${rootDomain}`
      const postUrl = `https://${host}/blog/${post.slug}`
      const imageUrl = post.featuredImage || ""
      const message = `${post.title}\n\nBaca selengkapnya:\n${postUrl}`

      const credentials = await db.socialMediaCredential.findMany({
        where: { tenantId, isActive: true }
      })

      const results = await Promise.allSettled(
        credentials.map(async (cred) => {
          if (cred.platform === "TELEGRAM") {
            if (!cred.externalId) throw new Error("Missing Telegram Chat ID")
            return SocialShareService.shareToTelegram(cred.accessToken, cred.externalId, message)
          } else if (cred.platform === "FACEBOOK") {
            if (!cred.externalId) throw new Error("Missing Facebook Page ID")
            return SocialShareService.shareToFacebook(cred.externalId, cred.accessToken, post.title, postUrl)
          } else if (cred.platform === "TWITTER") {
            if (!cred.refreshToken) throw new Error("Missing Twitter Token Secret")
            const settings = await db.platformSetting.findMany({
              where: { key: { in: ['TWITTER_API_KEY', 'TWITTER_API_SECRET'] } }
            })
            const apiKey = settings.find(s => s.key === 'TWITTER_API_KEY')?.value || ""
            const apiSecret = settings.find(s => s.key === 'TWITTER_API_SECRET')?.value || ""
            return SocialShareService.shareToTwitter(cred.accessToken, cred.refreshToken || "", message, apiKey, apiSecret)
          } else if (cred.platform === "INSTAGRAM") {
            if (!cred.externalId) throw new Error("Missing Instagram User ID")
            return SocialShareService.shareToInstagram(cred.externalId, cred.accessToken, imageUrl, message)
          } else if (cred.platform === "THREADS") {
            if (!cred.externalId) throw new Error("Missing Threads User ID")
            return SocialShareService.shareToThreads(cred.externalId, cred.accessToken, message)
          }
        })
      )

      const failures = results.filter(r => r.status === "rejected")
      if (failures.length > 0) {
        console.error(`[social-share-queue] Failed shares:`, failures)
        await db.errorLog.create({
          data: {
            tenantId,
            category: "SOCIAL_SHARE_FAILED",
            message: `Failed to share post ${postId} to ${failures.length} platforms`,
            metadata: failures.map((f: any) => f.reason?.message || f.reason),
          }
        })
      }

      return { success: true, processed: credentials.length, failed: failures.length }
    } catch (error: any) {
      console.error(`[social-share-queue] Critical error:`, error.message)
      throw error
    }
  },
  { connection, concurrency: 5 }
)

applyEnterpriseHandling(socialShareWorker)
