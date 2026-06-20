import { Queue } from "bullmq";

const redisOptions = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD || undefined,
};

const connection = process.env.REDIS_URL
  ? { url: process.env.REDIS_URL } // simplified for bullmq connection init if needed, usually we pass ioredis instance
  : redisOptions;

// We use ioredis in the worker, but for adding jobs, passing connection options is fine.
export const socialQueue = new Queue("social-share-queue", {
  connection: process.env.REDIS_URL ? { url: process.env.REDIS_URL } : redisOptions as any,
});

export async function addSocialShareJob(tenantId: string, postId: string) {
  await socialQueue.add("share-post", { tenantId, postId }, {
    attempts: 3,
    backoff: { type: "exponential", delay: 10000 },
    removeOnComplete: true,
    removeOnFail: 100, // keep some history of failed jobs
  });
}
