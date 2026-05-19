import { Queue, DefaultJobOptions } from "bullmq"
import { redisConnection } from "./redis"

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
export const importQueue = new Queue("import-queue", {
  connection: redisConnection,
  defaultJobOptions,
})

// Queue for processing outgoing WhatsApp messages
export const waQueue = new Queue("wa-queue", {
  connection: redisConnection,
  defaultJobOptions,
})

// Queue for processing recurring invoices/SPP
export const billingQueue = new Queue("billing-queue", {
  connection: redisConnection,
  defaultJobOptions,
})

// Queue for gamification calculations
export const gamificationQueue = new Queue("gamification-queue", {
  connection: redisConnection,
  defaultJobOptions,
})

// Queue for sending automated emails
export const emailQueue = new Queue("email-queue", {
  connection: redisConnection,
  defaultJobOptions,
})
