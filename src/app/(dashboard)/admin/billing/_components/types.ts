export interface TenantBilling {
  id: string; name: string; plan: string; employeeCount: number
  isActive: boolean; expiresAt: string | null
  pricing: { PRICE_PER_STUDENT: number; MIN_STUDENTS: number }
  hasPendingInvoice?: boolean
  upgradeEnabled?: boolean
  manualPayment?: { bank: string; number: string; name: string; waNumber: string }
  lockedPricePerStudent?: number | null
}

export interface PlanInfo {
  slug: string; name: string; description: string; price: number
  interval: string; maxTeamMembers: number; maxStorage: number
  features: string[]; isPopular: boolean
}

export interface InvoiceData {
  id: string; reference: string; amount: number; studentCount?: number; aiTokens?: number
  pricePerStudent?: number; tenantName: string
  expiredAt: string; status: string; createdAt: string
  subTotal?: number; discountAmount?: number
}
