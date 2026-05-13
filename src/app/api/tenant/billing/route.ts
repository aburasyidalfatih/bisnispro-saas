import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getPricingConfig } from "@/lib/services/billing"
import { headers } from "next/headers"

export const dynamic = "force-dynamic"

// Prisma JSON fields may come back as array, string, or other shapes
function normalizeFeatures(raw: any): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.filter((f: any) => typeof f === "string")
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed.filter((f: any) => typeof f === "string") : []
    } catch {
      return []
    }
  }
  return []
}

export async function GET() {
  const session = await auth() as any
  const headersList = await headers()
  let slug = headersList.get("x-tenant-slug")
  
  if (!slug) {
    const host = headersList.get("host") || ""
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "schoolpro.test"
    if (host.endsWith(`.${rootDomain}`)) {
      slug = host.replace(`.${rootDomain}`, "")
    } else if (host !== rootDomain && !host.startsWith("www.")) {
      slug = host.split(".")[0] // Fallback local test
    }
  }

  const tenantUser = session?.user?.tenants?.find((t: any) => t.slug === slug)
  if (!tenantUser) return NextResponse.json({ error: "Unauthorized", slug_detected: slug }, { status: 401 })
  const tenantId = tenantUser.id

  const [tenant, pricing, proPlan, pendingPayment, platformSettings] = await Promise.all([
    db.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        plan: true,
        studentQuota: true,
        isActive: true,
        expiresAt: true
      }
    }),
    getPricingConfig(),
    db.subscriptionPlan.findUnique({
      where: { slug: "pro" },
      select: { features: true }
    }),
    db.payment.findFirst({
      where: { tenantId, status: "pending" },
      select: { id: true }
    }),
    db.platformSetting.findMany({
      where: { key: { in: ["enable_billing_upgrade", "MANUAL_PAYMENT_BANK", "MANUAL_PAYMENT_NUMBER", "MANUAL_PAYMENT_NAME", "MANUAL_PAYMENT_WA"] } },
      select: { key: true, value: true }
    })
  ])

  // Untuk tenant PRO aktif: cari harga dari payment PAID terakhir (harga kontrak)
  let lockedPricePerStudent: number | null = null
  if (tenant?.plan === "pro" && tenant.isActive && tenant.expiresAt && new Date(tenant.expiresAt) > new Date()) {
    const lastPaid = await db.payment.findFirst({
      where: { tenantId, status: "paid", plan: "pro" },
      orderBy: { paidAt: "desc" },
      select: { metadata: true }
    })
    const metaPrice = (lastPaid?.metadata as any)?.pricePerStudent
    if (metaPrice && metaPrice > 0) lockedPricePerStudent = metaPrice
  }

  const proFeatures = normalizeFeatures(proPlan?.features)

  const upgradeEnabled = platformSettings.find(s => s.key === "enable_billing_upgrade")?.value === "true"
  const manualPayment = {
    bank: platformSettings.find(s => s.key === "MANUAL_PAYMENT_BANK")?.value || "Bank BCA",
    number: platformSettings.find(s => s.key === "MANUAL_PAYMENT_NUMBER")?.value || "1234 5678 90",
    name: platformSettings.find(s => s.key === "MANUAL_PAYMENT_NAME")?.value || "PT SchoolPro Indonesia",
    waNumber: platformSettings.find(s => s.key === "MANUAL_PAYMENT_WA")?.value || "6281234567890",
  }

  return NextResponse.json({
    ...tenant,
    pricing,
    proFeatures,
    hasPendingInvoice: !!pendingPayment,
    upgradeEnabled,
    manualPayment,
    lockedPricePerStudent
  })
}
