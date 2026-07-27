import { z } from "zod"

export const rfqSchema = z.object({
  buyerName: z.string().trim().min(2, "Name is required").max(120),
  buyerEmail: z.string().trim().email("Invalid email address").max(254),
  buyerPhone: z.string().trim().max(40).optional(),
  companyName: z.string().trim().max(160).optional(),
  country: z.string().trim().max(100).optional(),
  productInterest: z.string().trim().min(2, "Product/Service of interest is required").max(240),
  quantity: z.string().trim().max(120).optional(),
  deliveryTerms: z.string().trim().max(100).optional(),
  targetTimeline: z.string().trim().max(120).optional(),
  additionalMessage: z.string().trim().max(3000).optional(),
  privacyConsent: z.literal(true, { error: "Consent is required" }),
  companyWebsite: z.string().max(0).optional(), // Honeypot: must remain empty
})

export type RfqFormValues = z.infer<typeof rfqSchema>
