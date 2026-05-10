import { serve } from "inngest/next"
import { inngest } from "@/lib/inngest/client"
import { importStudentsJob, importUsersJob, generateInvoicesJob } from "@/lib/inngest/functions"

// Serve the Inngest functions as an API route
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    importStudentsJob,
    importUsersJob,
    generateInvoicesJob,
  ],
})
