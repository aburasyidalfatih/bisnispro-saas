import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { parseBody } from "@/lib/api-utils"
import { invalidatePublicTenantCache } from "@/features/tenant/services/tenant-public.service"

const websiteSchema = z.object({
  tenantId: z.string().min(1),
  // Identitas
  name: z.string().min(1).max(100).optional(),
  tagline: z.string().max(200).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  about: z.string().max(10000).optional().nullable(),
  logo: z.string().max(500).optional().nullable(),
  heroImage: z.string().max(500).optional().nullable(),
  // Kontak
  address: z.string().max(300).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  email: z.string().email().optional().nullable(),
  website: z.string().url().optional().nullable(),
  whatsapp: z.string().max(20).optional().nullable(),
  // Sosial media
  instagram: z.string().max(100).optional().nullable(),
  facebook: z.string().max(100).optional().nullable(),
  youtube: z.string().max(100).optional().nullable(),
  tiktok: z.string().max(100).optional().nullable(),
  telegram: z.string().max(100).optional().nullable(),
  // Konten JSON
  gallery: z.array(z.any()).optional().nullable(),
  settings: z.record(z.any()).optional().nullable(),
  // SEO
  seoTitle: z.string().max(70).optional().nullable(),
  seoDesc: z.string().max(160).optional().nullable(),
  // Google Auth
  googleClientId: z.string().optional().nullable(),
  googleClientSecret: z.string().optional().nullable(),
})

// GET: ambil data website tenant
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  if (!tenantId) return NextResponse.json({ error: "tenantId harus diisi" }, { status: 400 })

  const { error } = await (await import("@/lib/api-utils")).requireTenantMembership(tenantId)
  if (error) return error

  try {
    const { getWebsiteData } = await import("@/features/tenant/services/tenant-management.service")
    const tenant = await getWebsiteData(tenantId)

    // SANITASI DATA: Cek apakah user adalah admin/owner
    let isPrivileged = session.user.isSuperAdmin === true;
    if (!isPrivileged && session.user.tenants) {
      const currentTenant = session.user.tenants.find((t: any) => t.id === tenantId)
      if (currentTenant && ["owner", "admin"].includes(currentTenant.role)) {
        isPrivileged = true
      }
    }

    if (!isPrivileged && tenant) {
      // Hapus secrets dari root model
      if ('googleClientSecret' in tenant) delete tenant.googleClientSecret;
      
      // Sanitasi settings jika ada
      if (tenant.settings && typeof tenant.settings === 'object') {
        const settings = tenant.settings as any;
        // Hapus kredensial SMTP
        if (settings.smtp) delete settings.smtp;
        
        // Hapus kunci rahasia lainnya agar tidak terekspos ke publik / network tab
        delete settings.whatsappToken;
        delete settings.waGateway;
        delete settings.paymentGatewaySecret;
      }
    }

    return NextResponse.json(tenant)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Tenant tidak ditemukan" }, { status: 404 })
  }
}

// PUT: update data website tenant
export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = await parseBody(req, websiteSchema)
  if (parsed.error) return parsed.error
  const { tenantId, ...data } = parsed.data

  try {
    const { updateWebsiteData } = await import("@/features/tenant/services/tenant-management.service")
    const updated = await updateWebsiteData(tenantId, data, session.user.id, session.user.isSuperAdmin)
    return NextResponse.json({ message: "Website berhasil diperbarui", tenant: updated })
  } catch (error: any) {
    const status = error.message?.includes("izin") ? 403 : 500
    return NextResponse.json({ error: error.message || "Terjadi kesalahan" }, { status })
  }
}
