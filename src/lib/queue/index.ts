import { Queue, DefaultJobOptions } from "bullmq"
import { redisConnection } from "./redis"

const isBuildPhase = process.env.npm_lifecycle_event === "build" || process.env.NEXT_PHASE?.includes("build")

function createQueue(name: string, options: any) {
  if (isBuildPhase) {
    return { add: async () => {}, name } as unknown as Queue
  }
  return new Queue(name, options)
}

const defaultJobOptions: DefaultJobOptions = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 2000,
  },
  removeOnComplete: {
    age: 3600, // keep completed jobs for 1 hour
    count: 1000,
  },
  removeOnFail: {
    age: 24 * 3600, // keep failed jobs for 24 hours
  },
}

// Queue for processing heavy CSV imports (students, staff, etc.)
export const importQueue = createQueue("import-queue", {
  connection: redisConnection,
  defaultJobOptions,
})

// Queue for processing outgoing WhatsApp messages
export const waQueue = createQueue("wa-queue", {
  connection: redisConnection,
  defaultJobOptions,
})

// Queue for processing recurring invoices/SPP
export const billingQueue = createQueue("billing-queue", {
  connection: redisConnection,
  defaultJobOptions,
})

// Queue for gamification calculations
export const gamificationQueue = createQueue("gamification-queue", {
  connection: redisConnection,
  defaultJobOptions,
})

// Queue for sending automated emails
export const emailQueue = createQueue("email-queue", {
  connection: redisConnection,
  defaultJobOptions,
})

// Queue for processing CBT background scoring
export const cbtQueue = createQueue("cbt-queue", {
  connection: redisConnection,
  defaultJobOptions,
})
