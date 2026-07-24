/**
 * Public API: Contact Form Submission
 * POST /api/website/[slug]/contact
 *
 * Tidak butuh auth — form publik dari website tenant.
 * Menyimpan submission ke DB dan mengirim notifikasi ke owner/admin.
 */

import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { rateLimit } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"

const contactSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100),
  email: z.string().email("Email tidak valid"),
  phone: z.string().max(20).optional().nullable(),
  subject: z.string().max(200).optional().nullable(),
  message: z.string().min(10, "Pesan minimal 10 karakter").max(2000),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  // Rate limit: 5 submissions per IP per 10 menit
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous"
  const { success } = await rateLimit(`contact:${ip}`, 5, 600_000)
  if (!success) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Coba lagi dalam beberapa menit." },
      { status: 429 }
    )
  }

  // Validasi body
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Request body tidak valid" }, { status: 400 })
  }

  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) {
    const messages = parsed.error.issues.map(e => e.message).join(", ")
    return NextResponse.json({ error: messages }, { status: 400 })
  }

  // Cari tenant
  const tenant = await db.tenant.findUnique({
    where: { slug, isActive: true },
    select: { id: true, name: true, email: true },
  })
  if (!tenant) {
    return NextResponse.json({ error: "Tenant tidak ditemukan" }, { status: 404 })
  }

  // Simpan submission
  const submission = await db.contactSubmission.create({
    data: {
      tenantId: tenant.id,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      subject: parsed.data.subject || null,
      message: parsed.data.message,
      ipAddress: ip,
    },
  })

  // Kirim notifikasi in-app ke semua owner/admin tenant
  try {
    const admins = await db.tenantUser.findMany({
      where: { tenantId: tenant.id, role: { in: ["owner", "admin"] } },
      select: { userId: true },
    })

    if (admins.length > 0) {
      await db.notification.createMany({
        data: admins.map(a => ({
          tenantId: tenant.id,
          userId: a.userId,
          title: `Pesan baru dari ${parsed.data.name}`,
          message: parsed.data.subject
            ? `${parsed.data.subject}: ${parsed.data.message.slice(0, 100)}...`
            : parsed.data.message.slice(0, 120),
          type: "info",
          channel: "inapp",
          metadata: { submissionId: submission.id, email: parsed.data.email },
        })),
      })
    }
  } catch (err) {
    // Notifikasi gagal tidak boleh block response
    logger.warn("Failed to create contact notification", { error: String(err) })
  }

  logger.info("Contact form submitted", { tenantId: tenant.id, slug, submissionId: submission.id })

  return NextResponse.json({
    message: "Pesan Anda berhasil dikirim. Kami akan segera menghubungi Anda.",
    id: submission.id,
  })
}
