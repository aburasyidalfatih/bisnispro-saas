/**
 * API Internal: Slug Lookup untuk Redirect Edge Middleware
 *
 * GET /api/internal/slug-lookup?slug=demo-tenant
 *
 * Dipakai oleh middleware.ts (Edge Runtime) yang tidak bisa query Prisma langsung.
 * Middleware memanggil endpoint ini untuk mengecek apakah slug memiliki custom domain.
 *
 * KEAMANAN:
 * - Hanya bisa dipanggil dari internal (cek header x-internal-secret)
 * - Response di-cache di Redis oleh domain service
 */

import { NextResponse } from "next/server"
import { resolveSlugToDomain } from "@/features/tenant/services/domain.service"

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || ""

export async function GET(req: Request) {
  // Validasi internal secret
  const secret = req.headers.get("x-internal-secret")
  if (secret !== INTERNAL_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const url = new URL(req.url)
  const slug = url.searchParams.get("slug")

  if (!slug) {
    return NextResponse.json({ error: "slug harus diisi" }, { status: 400 })
  }

  const domain = await resolveSlugToDomain(slug)

  if (!domain) {
    return NextResponse.json({ domain: null }, { status: 404 })
  }

  return NextResponse.json(
    { domain },
    {
      headers: {
        // Cache di CDN/edge selama 5 menit
        "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
      },
    }
  )
}
