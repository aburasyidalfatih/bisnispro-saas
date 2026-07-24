import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { generateText } from "ai"
import { getSuperAdminAiModel } from "@/features/ai/services/super-admin-ai.service"
import { logger } from "@/lib/logger"

export const maxDuration = 60 // 60 seconds timeout

// GET: Fetch latest analysis reports
export async function GET() {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Fetch latest reports from platform_settings
    const reports = await db.platformSetting.findMany({
      where: { key: { startsWith: "ADS_AI_REPORT_" } },
      orderBy: { key: "desc" },
    })

    const parsed = reports.map(r => {
      try {
        return JSON.parse(r.value)
      } catch {
        return null
      }
    }).filter(Boolean)

    return NextResponse.json({ reports: parsed })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: Generate new AI analysis
export async function POST(req: Request) {
  // Allow both session auth and CRON_SECRET for weekly cron
  const authHeader = req.headers.get("authorization")
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`

  if (!isCron) {
    const session = await auth()
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  try {
    // 1. Get Meta Ads credentials
    const settings = await db.platformSetting.findMany({
      where: { key: { in: ["META_ADS_ACCESS_TOKEN", "META_ADS_ACCOUNT_ID"] } },
    })
    const token = settings.find(s => s.key === "META_ADS_ACCESS_TOKEN")?.value
    const accountId = settings.find(s => s.key === "META_ADS_ACCOUNT_ID")?.value

    if (!token || !accountId) {
      return NextResponse.json({ error: "Meta Ads belum terhubung" }, { status: 400 })
    }

    // 2. Fetch last 7 days campaign data from Meta
    const [campaignsRes, dailyRes, ageRes, placeRes] = await Promise.all([
      fetch(`https://graph.facebook.com/v21.0/act_${accountId}/insights?fields=campaign_id,campaign_name,spend,impressions,clicks,cpc,ctr,reach,frequency,actions,cost_per_action_type&date_preset=last_7d&level=campaign&limit=50&access_token=${token}`),
      fetch(`https://graph.facebook.com/v21.0/act_${accountId}/insights?fields=spend,impressions,clicks,reach,actions&date_preset=last_7d&time_increment=1&limit=14&access_token=${token}`),
      fetch(`https://graph.facebook.com/v21.0/act_${accountId}/insights?fields=spend,impressions,clicks,actions&date_preset=last_7d&breakdowns=age,gender&limit=50&access_token=${token}`),
      fetch(`https://graph.facebook.com/v21.0/act_${accountId}/insights?fields=spend,impressions,clicks&date_preset=last_7d&breakdowns=publisher_platform&limit=20&access_token=${token}`),
    ])

    const [campaignsData, dailyData, ageData, placeData] = await Promise.all([
      campaignsRes.json(), dailyRes.json(), ageRes.json(), placeRes.json(),
    ])

    if (campaignsData.error) {
      return NextResponse.json({ error: campaignsData.error.message }, { status: 400 })
    }

    // 3. Fetch internal BisnisPro data (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const [recentApps, recentPayments, totalTenants] = await Promise.all([
      db.tenantApplication.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { id: true, status: true, createdAt: true },
      }),
      db.payment.findMany({
        where: { status: "paid", deletedAt: null, createdAt: { gte: sevenDaysAgo } },
        select: { amount: true, plan: true },
      }),
      db.tenant.count(),
    ])

    const weeklyRegistrations = recentApps.length
    const weeklyApproved = recentApps.filter(a => a.status === "APPROVED").length
    const weeklyRevenue = recentPayments.reduce((s, p) => s + p.amount, 0)

    // 4. Build data summary for AI
    const dataSummary = {
      period: "7 hari terakhir",
      meta_ads: {
        campaigns: (campaignsData.data || []).map((c: any) => ({
          name: c.campaign_name,
          spend: c.spend,
          impressions: c.impressions,
          clicks: c.clicks,
          cpc: c.cpc,
          ctr: c.ctr,
          reach: c.reach,
          frequency: c.frequency,
          leads: c.actions?.find((a: any) => a.action_type === "lead")?.value || 0,
          cost_per_lead: c.cost_per_action_type?.find((a: any) => a.action_type === "lead")?.value || 0,
        })),
        daily_trend: (dailyData.data || []).map((d: any) => ({
          date: d.date_start,
          spend: d.spend,
          clicks: d.clicks,
          impressions: d.impressions,
        })),
        demographics: (ageData.data || []).slice(0, 20).map((d: any) => ({
          age: d.age, gender: d.gender, clicks: d.clicks, spend: d.spend,
        })),
        platforms: (placeData.data || []).map((d: any) => ({
          platform: d.publisher_platform, clicks: d.clicks, spend: d.spend, impressions: d.impressions,
        })),
      },
      bisnispro_internal: {
        total_tenants: totalTenants,
        weekly_registrations: weeklyRegistrations,
        weekly_approved: weeklyApproved,
        weekly_revenue: weeklyRevenue,
        conversion_rate: weeklyRegistrations > 0 ? ((weeklyApproved / weeklyRegistrations) * 100).toFixed(1) + "%" : "0%",
      },
    }

    // 5. Generate AI analysis
    const aiResult = await getSuperAdminAiModel()
    if (!aiResult.success || !aiResult.model) {
      return NextResponse.json({ error: aiResult.error }, { status: 500 })
    }

    const prompt = `Kamu adalah seorang Digital Marketing Expert, Copywriter, dan Data Analyst profesional untuk platform SaaS bernama BisnisPro (platform manajemen perusahaan berbasis web untuk UMKM dan perusahaan di Indonesia).

BisnisPro menawarkan:
- Website perusahaan profesional
- Sistem akademik (absensi, nilai, rapor)  
- Keuangan perusahaan (SPP, pembayaran online)
- PPDB Online
- Paket: Free (gratis), Lite (Rp 500/klien/bulan), Pro (Rp 1.000/klien/bulan)
- Target: Kepala Perusahaan, Operator Perusahaan, Yayasan Pendidikan

Analisa data iklan Meta Ads dan data internal berikut secara mendalam. Tujuan utama: **BIAYA SEMINIMAL MUNGKIN, HASIL SEMAKSIMAL MUNGKIN**.

DATA:
${JSON.stringify(dataSummary, null, 2)}

Berikan analisa dalam format Markdown dengan struktur berikut:

## 📊 Ringkasan Performa Minggu Ini
- Total spend, clicks, reach, CPC rata-rata
- Perbandingan dengan standar industri SaaS edtech (CPC ideal < Rp 500, CTR ideal > 2%)

## 🏆 Kampanye Terbaik & Terburuk  
- Identifikasi kampanye dengan CPC terendah dan tertinggi
- Kampanye mana yang harus di-scale up dan mana yang harus dihentikan

## 👥 Analisa Demografi
- Kelompok usia & gender mana yang paling responsif
- Rekomendasi targeting yang optimal

## 📱 Analisa Platform
- Facebook vs Instagram — mana yang lebih efektif?
- Rekomendasi alokasi budget per platform

## 📈 Tren & Pola
- Tren harian (hari apa yang terbaik)
- Apakah ada tanda audience fatigue (frequency tinggi)?

## 🔄 Funnel Conversion
- Dari Ads → Registrasi → Approved → Revenue
- Dimana bottleneck terbesar?
- Berapa ideal Cost per Acquisition?

## 💡 Rekomendasi Aksi Minggu Depan
1. [Aksi spesifik 1 — misal: Naikkan budget kampanye X ke Rp Y]
2. [Aksi spesifik 2 — misal: Jeda kampanye Y karena CPC terlalu tinggi]
3. [Aksi spesifik 3 — misal: Ubah targeting ke usia 25-44 wanita]
4. [Aksi spesifik 4 — misal: Buat creative baru untuk kampanye Z]
5. [Dst — berikan minimal 5 rekomendasi konkret]

## ✍️ Rekomendasi Ad Copy (5 Variasi untuk A/B Testing)

Berdasarkan data demografi dan kampanye terbaik, buat 5 variasi ad copy yang optimal. Setiap variasi harus menggunakan pendekatan psikologi berbeda:

### Variasi 1: Pain Point
- **Headline (max 40 karakter):** [Menyentuh masalah utama target]
- **Primary Text (max 125 karakter):** [...]  
- **Description:** [Paragraf 2-3 kalimat yang persuasif, menyentuh frustrasi admin perusahaan yang masih manual]
- **CTA Button:** [Pilih: Daftar Sekarang / Pelajari Selengkapnya / Coba Gratis]
- **Target Audience:** [Usia, gender, interest berdasarkan data]

### Variasi 2: Social Proof / Testimoni
- **Headline:** [Angka pengguna/perusahaan yang sudah pakai]
- **Primary Text:** [...]
- **Description:** [Bukti sosial, berapa perusahaan sudah bergabung]
- **CTA Button:** [...]
- **Target Audience:** [...]

### Variasi 3: FOMO (Fear of Missing Out)
- **Headline:** [Urgensi atau ketertinggalan]
- **Primary Text:** [...]
- **Description:** [Perusahaan lain sudah digital, apakah Anda mau tertinggal?]
- **CTA Button:** [...]
- **Target Audience:** [...]

### Variasi 4: Benefit / Value
- **Headline:** [Manfaat utama yang didapat]
- **Primary Text:** [...]
- **Description:** [Fokus pada apa yang didapat: hemat waktu, profesional, otomatis]
- **CTA Button:** [...]
- **Target Audience:** [...]

### Variasi 5: Free Trial / Gratis
- **Headline:** [Menekankan gratis/tanpa risiko]
- **Primary Text:** [...]
- **Description:** [Ajakan coba gratis, tanpa kartu kredit, langsung bisa pakai]
- **CTA Button:** [...]
- **Target Audience:** [...]

## 🎨 Prompt Gambar Iklan (5 Variasi)

Buat 5 prompt detail untuk generate gambar iklan menggunakan AI image generator (Midjourney/DALL-E/Ideogram). Prompt harus spesifik dan sesuai ad copy di atas.

### Gambar 1: Cocok untuk Ad Copy Pain Point
**Prompt:** "[Prompt bahasa Inggris yang detail: subject, style, colors, composition, mood. Harus menggambarkan kontras antara cara manual vs digital. Format landscape]"
**Format:** Facebook Feed (1200x628)

### Gambar 2: Cocok untuk Ad Copy Social Proof
**Prompt:** "[Menampilkan banyak perusahaan/staf yang happy menggunakan platform. Warna cerah, profesional]"
**Format:** Instagram Feed (1080x1080)

### Gambar 3: Cocok untuk Ad Copy FOMO
**Prompt:** "[Visual yang menunjukkan modernisasi/transformasi digital perusahaan. Dramatic, eye-catching]"
**Format:** Instagram Story (1080x1920)

### Gambar 4: Cocok untuk Ad Copy Benefit
**Prompt:** "[Dashboard mockup yang clean, menampilkan fitur-fitur utama. Professional, trust-building]"
**Format:** Facebook Feed (1200x628)

### Gambar 5: Cocok untuk Ad Copy Free Trial
**Prompt:** "[Welcoming, friendly, mengajak coba. Warna hangat, inklusif, smartphone/laptop mockup]"
**Format:** Instagram Reels Cover (1080x1920)

## 💰 Estimasi Optimasi
- Potensi penghematan jika rekomendasi dijalankan
- Estimasi peningkatan leads/registrasi
- Budget optimal yang disarankan minggu depan

Gunakan bahasa Indonesia yang profesional. Berikan angka konkret. Ad copy harus natural dan tidak terasa seperti spam. Prompt gambar harus dalam bahasa Inggris yang detail dan spesifik.`

    const { text } = await generateText({
      model: aiResult.model,
      prompt,

    })

    // 6. Save report
    const reportDate = new Date().toISOString().split("T")[0]
    const reportKey = `ADS_AI_REPORT_${reportDate}`
    const reportData = {
      date: reportDate,
      generatedAt: new Date().toISOString(),
      analysis: text,
      dataSummary: {
        totalSpend: (campaignsData.data || []).reduce((s: number, c: any) => s + parseFloat(c.spend || '0'), 0),
        totalClicks: (campaignsData.data || []).reduce((s: number, c: any) => s + parseInt(c.clicks || '0'), 0),
        totalReach: (campaignsData.data || []).reduce((s: number, c: any) => s + parseInt(c.reach || '0'), 0),
        weeklyRegistrations,
        weeklyApproved,
        weeklyRevenue,
        campaignCount: (campaignsData.data || []).length,
      },
    }

    await db.platformSetting.upsert({
      where: { key: reportKey },
      create: { key: reportKey, value: JSON.stringify(reportData) },
      update: { value: JSON.stringify(reportData) },
    })

    // Keep only last 12 reports
    const allReports = await db.platformSetting.findMany({
      where: { key: { startsWith: "ADS_AI_REPORT_" } },
      orderBy: { key: "desc" },
    })
    if (allReports.length > 12) {
      const toDelete = allReports.slice(12)
      await db.platformSetting.deleteMany({
        where: { key: { in: toDelete.map(r => r.key) } },
      })
    }

    logger.info("AI Ads Analysis generated", { date: reportDate })

    return NextResponse.json({ success: true, report: reportData })
  } catch (error: any) {
    logger.error("AI Ads Analysis Error", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
