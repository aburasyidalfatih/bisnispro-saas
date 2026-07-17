import { Worker, Job } from "bullmq"
import { connection, applyEnterpriseHandling } from "./shared"
import { processGamificationPoints } from "@/features/gamification/services/gamification.service"

export const gamificationWorker = new Worker(
  "gamification-queue",
  async (job: Job) => {
    console.log(`[gamification-queue] Adding points to user ${job.data.userId}...`)
    await processGamificationPoints(job.data)
    return { success: true }
  },
  { connection, concurrency: 10 }
)

applyEnterpriseHandling(gamificationWorker)
