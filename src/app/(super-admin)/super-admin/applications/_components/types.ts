export interface Application {
  id: string
  businessName: string
  businessSlug: string
  npsn: string
  schoolStatus: string
  province: string
  regency: string
  adminName: string
  adminPosition?: string | null
  adminEmail: string
  adminPhone: string
  address: string
  status: string
  adminMessage: string
  emailOpenedAt?: string | null
  createdAt: string
  updatedAt: string
  logo?: string | null
  studentCount?: number
  affiliate?: { user: { name: string } } | null
}
