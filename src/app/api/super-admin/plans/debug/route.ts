import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

// Temporary diagnostic & fix endpoint - remove after use
export async function GET() {
  const session = await auth() as any
  if (!session?.user?.isSuperAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  // Read current PRO plan from DB
  const proPlan = await db.subscriptionPlan.findUnique({
    where: { slug: "pro" },
  })

  return NextResponse.json({
    id: proPlan?.id,
    name: proPlan?.name,
    features_type: typeof proPlan?.features,
    features_isArray: Array.isArray(proPlan?.features),
    features_raw: proPlan?.features,
    features_json: JSON.stringify(proPlan?.features),
  })
}

export async function POST() {
  const session = await auth() as any
  if (!session?.user?.isSuperAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  // Force-update PRO plan features to known working state
  const updated = await db.subscriptionPlan.update({
    where: { slug: "pro" },
    data: {
      features: [
        "Manajemen Data Klien Lengkap",
        "E-Rapor & Cetak Dokumen Otomatis",
        "Keuangan & SPP Digital",
        "Fitur Absensi & Notifikasi Ortu",
        "Support Prioritas 24/7",
      ],
    },
  })

  return NextResponse.json({
    success: true,
    features_saved: updated.features,
  })
}
