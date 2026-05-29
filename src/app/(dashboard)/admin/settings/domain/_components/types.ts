export type DomainStatus = "unverified" | "pending" | "verified" | "failed"

export interface CustomDomainInfo {
  domain: string
  status: DomainStatus
  verifyToken: string
  verifiedAt?: string
  failReason?: string
}

export interface DomainData {
  slug: string
  domain: string | null
  customDomain: CustomDomainInfo | null
  isCustomDomainEnabled?: boolean
  lockedMessage?: string
  hasChangedSubdomain?: boolean
}
