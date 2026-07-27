import { z } from "zod"

export const rfqSchema = z.object({
  buyerName: z.string().min(2, "Name is required"),
  buyerEmail: z.string().email("Invalid email address"),
  buyerPhone: z.string().optional(),
  companyName: z.string().optional(),
  country: z.string().optional(),
  productInterest: z.string().min(2, "Product/Service of interest is required"),
  quantity: z.string().optional(),
  additionalMessage: z.string().optional(),
})

export type RfqFormValues = z.infer<typeof rfqSchema>
