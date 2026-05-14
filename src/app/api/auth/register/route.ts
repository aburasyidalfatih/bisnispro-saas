import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { generateSlug } from "@/lib/utils"
import { registerSchema } from "@/lib/validations/auth"
import { parseBody } from "@/lib/api-utils"
import { logger } from "@/lib/logger"
import { rateLimit } from "@/lib/rate-limit"

export async function POST(req: Request) {
  try {
    // Rate limit: 10 requests per minute per IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "anonymous"
    const { success } = await rateLimit(`auth:register:${ip}`, 10, 60_000)
    if (!success) {
      return NextResponse.json({ error: "Terlalu banyak permintaan. Coba lagi nanti." }, { status: 429 })
    }

    const parsed = await parseBody(req, registerSchema)
    if (parsed.error) return parsed.error
    const { name, password, tenantName, tenantSlug } = parsed.data
    const email = parsed.data.email.toLowerCase()

    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    // Jika tenantSlug ada, berarti user mendaftar di subdomain tenant (sebagai orang tua)
    if (tenantSlug) {
      const existingTenant = await db.tenant.findUnique({ where: { slug: tenantSlug } })
      if (!existingTenant) {
        return NextResponse.json({ error: "Sekolah tidak ditemukan" }, { status: 404 })
      }

      const result = await db.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: { name, email, password: hashedPassword },
        })

        await tx.tenantUser.create({
          data: { tenantId: existingTenant.id, userId: user.id, role: "orangtua" },
        })

        await tx.notificationSetting.createMany({
          data: [
            { userId: user.id, channel: "inapp", enabled: true },
            { userId: user.id, channel: "email", enabled: true },
            { userId: user.id, channel: "whatsapp", enabled: false },
          ],
        })

        return { user, tenant: existingTenant }
      })

      return NextResponse.json({
        message: "Registrasi berhasil",
        tenantSlug: result.tenant.slug,
      })
    }

    // Jika tenantSlug tidak ada (Mendaftar di domain utama / buat lembaga baru)
    if (!tenantName) {
      return NextResponse.json({ error: "Nama lembaga harus diisi" }, { status: 400 })
    }

    let slug = generateSlug(tenantName)

    // Pastikan slug unik
    const existingTenantBySlug = await db.tenant.findUnique({ where: { slug } })
    if (existingTenantBySlug) {
      slug = `${slug}-${Date.now().toString(36)}`
    }

    // Buat user, tenant, dan relasi dalam satu transaksi
    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name, email, password: hashedPassword },
      })

      const tenant = await tx.tenant.create({
        data: { name: tenantName, slug },
      })

      await tx.tenantUser.create({
        data: { tenantId: tenant.id, userId: user.id, role: "owner" },
      })

      // Buat default notification settings
      await tx.notificationSetting.createMany({
        data: [
          { userId: user.id, channel: "inapp", enabled: true },
          { userId: user.id, channel: "email", enabled: true },
          { userId: user.id, channel: "whatsapp", enabled: false },
        ],
      })

      return { user, tenant }
    })

    return NextResponse.json({
      message: "Registrasi berhasil",
      tenantSlug: result.tenant.slug,
    })
  } catch (error) {
    logger.error("Register failed", error, { path: "/api/auth/register" })
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
