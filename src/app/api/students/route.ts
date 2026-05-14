import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireTenantAccess } from "@/lib/guards/tenant-guard"
import { requireTenantMembership } from "@/lib/api-utils"
import { z } from "zod"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  const take = parseInt(url.searchParams.get("take") || "20")
  const page = parseInt(url.searchParams.get("page") || "1")
  const search = url.searchParams.get("search") || ""
  const classroomId = url.searchParams.get("classroomId") || undefined
  const isActive = url.searchParams.get("isActive") !== "false" // default: hanya aktif

  if (!tenantId) return NextResponse.json({ error: "tenantId diperlukan" }, { status: 400 })
  try {
    await requireTenantAccess(tenantId)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 })
  }

  const where: any = {
    tenantId,
    isActive,
    ...(classroomId && classroomId !== "all" ? { classroomId } : {}),
    ...(search ? {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { nis: { contains: search, mode: "insensitive" } },
        { nisn: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    } : {}),
  }

  const [students, total] = await Promise.all([
    db.student.findMany({
      where,
      include: {
        classroom: { select: { id: true, name: true } },
        walletAccount: { select: { id: true, balance: true } },
        parents: { select: { id: true, relation: true } },
        _count: { select: { invoices: { where: { deletedAt: null } } } },
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * take,
      take,
    }),
    db.student.count({ where }),
  ])

  const formattedStudents = students.map((s: any) => ({
    ...s
  }))

  return NextResponse.json({
    data: formattedStudents,
    meta: { total, page, totalPages: Math.ceil(total / take) },
  })
}

export async function POST(req: Request) {
  const body = await req.json()
  const { tenantId, name, nis, nisn, gender, birthPlace, birthDate, address,
    phone, email, fatherName, motherName, guardianName, classroomId } = body

  if (!tenantId || !name) return NextResponse.json({ error: "tenantId dan name wajib" }, { status: 400 })
  try {
    await requireTenantAccess(tenantId)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 })
  }

  const tenant = await db.tenant.findUnique({ where: { id: tenantId } })
  if (tenant?.plan === "free") {
    const studentCount = await db.student.count({ where: { tenantId } })
    if (studentCount >= 1) {
      return NextResponse.json({ error: "Paket Free maksimal 1 data siswa untuk uji coba. Silakan upgrade paket." }, { status: 403 })
    }
  }

  const student = await db.student.create({
    data: {
      tenantId, name, nis: nis || undefined, nisn: nisn || undefined,
      gender, birthPlace, birthDate: birthDate ? new Date(birthDate) : undefined,
      address, phone, email: email || undefined,
      fatherName, motherName, guardianName,
      classroomId: classroomId || undefined,
    },
  })

  return NextResponse.json(student, { status: 201 })
}
