export interface WebsiteData {
  name: string
  tagline: string
  description: string
  about: string
  logo: string | null
  heroImage: string | null
  address: string | null
  phone: string | null
  email: string | null
  whatsapp: string | null
  instagram: string | null
  facebook: string | null
  youtube: string | null
  services: any[] | null
  gallery: any[] | null
  domain: string | null
  customDomain: { status: string } | null
  plan?: string
  diskUsage?: number
  maxStorage?: number
  _count?: {
    posts: number
    documents: number
    facilities: number
    staff: number
    achievements: number
    alumni: number
    extracurriculars: number
    programs: number
    popups: number
    sliders: number
    events: number
    partnerships: number
    contactSubmissions: number
  }
}
