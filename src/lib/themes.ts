export interface ThemeConfig {
  id: string
  name: string
  description: string
  preview: string // emoji/icon representation
  category: "formal" | "modern" | "creative" | "futuristic"
}

export const themes: ThemeConfig[] = [
  {
    id: "corporate",
    name: "Corporate",
    description: "Profesional dan formal, cocok untuk instansi resmi dan perusahaan",
    preview: "🏢",
    category: "formal",
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Tenang dan terpercaya, nuansa biru laut yang elegan",
    preview: "🌊",
    category: "formal",
  },
  {
    id: "emerald",
    name: "Emerald",
    description: "Segar dan natural, warna hijau zamrud yang modern",
    preview: "💎",
    category: "modern",
  },
  {
    id: "sunset",
    name: "Sunset",
    description: "Hangat dan energik, gradasi oranye-merah muda yang dinamis",
    preview: "🌅",
    category: "creative",
  },
  {
    id: "aurora",
    name: "Aurora",
    description: "Default SchoolPro, gradasi violet-ungu yang lembut",
    preview: "🔮",
    category: "modern",
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    description: "Futuristik dan bold, neon cyan-magenta bergaya teknologi masa depan",
    preview: "⚡",
    category: "futuristic",
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Dark-first premium, hitam elegan dengan aksen biru elektrik",
    preview: "🌌",
    category: "futuristic",
  },
  {
    id: "hologram",
    name: "Hologram",
    description: "Ultra-futuristik, efek holografik dengan gradasi pelangi neon",
    preview: "🪩",
    category: "futuristic",
  },
  {
    id: "graphite",
    name: "Graphite",
    description: "Monokromatik minimalis bergaya pro untuk institusi modern",
    preview: "",
    category: "formal",
  },
  {
    id: "ruby",
    name: "Ruby",
    description: "Mewah dan berani, nuansa merah anggur yang sangat elegan",
    preview: "💎",
    category: "creative",
  },
  {
    id: "gold",
    name: "Prestige Gold",
    description: "Eksklusif dan elit, memancarkan aura kemewahan tingkat internasional",
    preview: "👑",
    category: "formal",
  },
  {
    id: "neon",
    name: "Neon Matrix",
    description: "Bahasa visual hacker dengan lime green murni, sempurna untuk IT",
    preview: "⚡",
    category: "futuristic",
  }
]

export const defaultThemeId = "aurora"
