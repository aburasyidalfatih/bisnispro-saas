export interface MetaConnection { 
  connected: boolean; 
  accountName: string; 
  accountId: string; 
  hasToken: boolean 
}

export interface MetaCampaign {
  id: string; name: string; status: string; objective: string
  dailyBudget: number; lifetimeBudget: number; spend: number
  impressions: number; clicks: number; cpc: number; ctr: number
  reach: number; frequency: number; leads: number; costPerLead: number
}

export interface DailyTrend { 
  date: string; spend: number; impressions: number; clicks: number; reach: number; leads: number 
}

export interface AgeGender { 
  age: string; gender: string; spend: number; impressions: number; clicks: number; reach: number; leads: number 
}

export interface Placement { 
  platform: string; position: string; spend: number; impressions: number; clicks: number; reach: number 
}

export interface Recommendation { 
  type: string; title: string; message: string; campaignName?: string 
}

export interface AiReport { 
  date: string; generatedAt: string; analysis: string; 
  dataSummary: { totalSpend: number; totalClicks: number; weeklyRegistrations: number; weeklyRevenue: number } 
}

export interface MetaData {
  campaigns: MetaCampaign[]
  summary: { totalSpend: number; totalImpressions: number; totalClicks: number; totalReach: number; avgCpc: number; avgCtr: number; totalLeads: number; frequency: number }
  dailyTrend: DailyTrend[]; ageGenderBreakdown: AgeGender[]; placementBreakdown: Placement[]
  recommendations: Recommendation[]; datePreset: string
}
