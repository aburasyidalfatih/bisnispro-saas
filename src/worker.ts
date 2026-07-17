import { waWorker } from "./workers/wa.worker"
import { importWorker } from "./workers/import.worker"
import { billingWorker } from "./workers/billing.worker"
import { gamificationWorker } from "./workers/gamification.worker"
import { emailWorker } from "./workers/email.worker"
import { cbtWorker } from "./workers/cbt.worker"
import { socialShareWorker } from "./workers/social-share.worker"
import { initCronJobs } from "./workers/cron.worker"

console.log("🛠️  Starting BullMQ Enterprise Workers...")

const workers = [waWorker, importWorker, billingWorker, gamificationWorker, emailWorker, cbtWorker, socialShareWorker]

console.log("✅ All BullMQ Workers are running and listening to queues!")
console.log("   Queues: wa-queue, import-queue, billing-queue, gamification-queue, email-queue, social-share-queue")
console.log("   Features: retry (3x exponential), dead-letter logging, Sentry reporting")

initCronJobs()
