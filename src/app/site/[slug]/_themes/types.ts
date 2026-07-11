/**
 * Public Tenant Types for Website Rendering
 * These types define the shape of data returned by getTenantLayoutData()
 * and used across all theme components, navbar, and footer.
 */

// ─── Sub-entity types ───

export interface PublicStaff {
  id: string
  name: string
  role: string | null
  imageUrl: string | null
  sortOrder: number
  nip: string | null
  email: string | null
}

export interface PublicAlumni {
  id: string
  name: string
  graduationYear: number
  currentPosition: string | null
  imageUrl: string | null
  testimonial: string | null
}

export interface PublicProgram {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
}

export interface PublicExtracurricular {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
}

export interface PublicFacility {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
}

export interface PublicAchievement {
  id: string
  title: string
  description: string | null
  level: string | null
  year: number | null
  imageUrl: string | null
  createdAt: Date | string
}

export interface PublicPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  coverImage: string | null
  status: string
  type: string
  createdAt: Date | string
  category?: { name: string } | null
  author?: { name: string; image?: string | null } | null
}

export interface PublicEvent {
  id: string
  title: string
  description: string | null
  location: string | null
  startDate: Date | string
  endDate: Date | string | null
}

export interface PublicDocument {
  id: string
  title: string
  fileUrl: string
  fileSize: number | null
  createdAt: Date | string
}

export interface PublicSlider {
  id: string
  title: string | null
  subtitle: string | null
  imageUrl: string
  linkUrl: string | null
  isActive: boolean
  sortOrder: number
}

export interface PublicPartnership {
  id: string
  name: string
  logo: string | null
  website: string | null
  isActive: boolean
  sortOrder: number
}

export interface PublicWebsiteMenu {
  id: string
  label: string
  url: string
  icon: string | null
  order: number
  isActive: boolean
  isSystem: boolean
  parentId: string | null
  children?: PublicWebsiteMenu[]
}

export interface PublicCustomTheme {
  id: string
  name: string
  author: string
  version: string
  thumbnail: string | null
  layoutHtml: string
  indexHtml: string
  facilityHtml: string | null
  aboutHtml: string | null
  staffHtml: string | null
  newsHtml: string | null
  newsDetailHtml: string | null
  galleryHtml: string | null
  contactHtml: string | null
  extracurricularHtml: string | null
  programHtml: string | null
  achievementHtml: string | null
  customCss: string
  customJs: string
}

// ─── Tenant Settings (JSON stored in DB) ───

export interface HeroHighlight {
  title: string
  desc: string
  icon?: string
}

export interface PpdbCta {
  title?: string
  point1?: string
  point2?: string
  point3?: string
}

export interface TenantSettings {
  principalName?: string
  principalTitle?: string
  principalImage?: string
  principalMessage?: string
  principalBadgeYear?: string
  visi?: string
  misi?: string
  videoProfil?: string
  npsn?: string
  akreditasi?: string
  establishedYear?: string
  operationalHours?: string
  schoolStatus?: string
  studentCount?: number
  province?: string
  regency?: string
  heroHighlights?: HeroHighlight[]
  ppdbCta?: PpdbCta
  [key: string]: unknown // Allow additional settings
}

// ─── Gallery Item ───

export interface GalleryItem {
  url: string
  caption?: string
}

// ─── Main Public Tenant Type ───

export interface PublicTenant {
  id: string
  name: string
  slug: string
  tagline: string | null
  description: string | null
  about: string | null
  heroImage: string | null
  gallery: GalleryItem[] | null
  phone: string | null
  whatsapp: string | null
  address: string | null
  email: string | null
  logo: string | null
  seoTitle: string | null
  seoDesc: string | null
  theme: string
  template: string
  customThemeId: string | null
  customTheme: PublicCustomTheme | null
  isActive: boolean
  instagram: string | null
  facebook: string | null
  youtube: string | null
  tiktok: string | null
  settings: TenantSettings | null
  createdAt: Date | string

  // Relations
  staff: PublicStaff[]
  alumni: PublicAlumni[]
  programs: PublicProgram[]
  extracurriculars: PublicExtracurricular[]
  facilities: PublicFacility[]
  achievements: PublicAchievement[]
  websiteMenus: PublicWebsiteMenu[]
  posts: PublicPost[]
  events: PublicEvent[]
  documents: PublicDocument[]
  sliders: PublicSlider[]
  partnerships: PublicPartnership[]
  faqs?: any[]

  // Aggregate counts
  _count?: {
    staff: number
    programs: number
    achievements: number
  }
}

// ─── Theme Props (used by theme components) ───

export interface StatItem {
  value: string
  label: string
  icon: string
}

export interface ThemeProps {
  tenant: PublicTenant
  base: string
  gallery: GalleryItem[]
  stats: StatItem[]
}
