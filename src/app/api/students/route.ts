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
  const { error } = await requireTenantAccess(tenantId)
  if (error) return error

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
        WalletAccount: { select: { id: true, balance: true } },
        parents: { select: { id: true, relation: true } },
        _count: { select: { Invoice: { where: { deletedAt: null } } } },
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * take,
      take,
    }),
    db.student.count({ where }),
  ])

  const formattedStudents = students.map((s: any) => ({
    ...s,
    walletAccount: s.WalletAccount,
    _count: {
      ...s._count,
      invoices: s._count?.Invoice,
    }
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
  const { error } = await requireTenantAccess(tenantId)
  if (error) return error

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
