import "next-auth"
import "next-auth/jwt"

interface TenantInfo {
  id: string
  name: string
  slug: string
  role: string
  theme: string
  template?: string
  logo?: string | null
  plan?: string
  planId?: string | null
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      isSuperAdmin: boolean
      twoFactorEnabled: boolean
      isAffiliate?: boolean
      tenants: TenantInfo[]
    }
  }

  interface User {
    isSuperAdmin?: boolean
    twoFactorEnabled?: boolean
    isAffiliate?: boolean
    tenants?: TenantInfo[]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    isSuperAdmin: boolean
    twoFactorEnabled: boolean
    isAffiliate?: boolean
    tenants: TenantInfo[]
  }
}
