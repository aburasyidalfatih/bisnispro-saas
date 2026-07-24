export interface SubscriptionPlan {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  interval: string
  features: any
  maxTeamMembers: number
  maxStorage: number
  monthlyAiTokens: number
  isActive: boolean
  isPopular: boolean
  sortOrder: number
}
