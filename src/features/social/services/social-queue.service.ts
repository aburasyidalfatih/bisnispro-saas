import { Queue } from "bullmq";

// Cleaned up variables
import { redisConnection } from "@/lib/queue/redis";

const isBuildPhase = process.env.npm_lifecycle_event === "build" || process.env.NEXT_PHASE?.includes("build");

export const socialQueue = isBuildPhase 
  ? { add: async () => {}, name: "social-share-queue" } as unknown as Queue
  : new Queue("social-share-queue", {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: true,
      }
    });

export async function addSocialShareJob(tenantId: string, postId: string) {
  await socialQueue.add("share-post", { tenantId, postId }, {
    attempts: 3,
    backoff: { type: "exponential", delay: 10000 },
    removeOnComplete: true,
    removeOnFail: 100, // keep some history of failed jobs
  });
}
