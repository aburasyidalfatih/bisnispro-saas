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
  let { tenantId, name, nis, nisn, gender, birthPlace, birthDate, address,
    phone, email, fatherName, motherName, guardianName, classroomId, password } = body

  if (!tenantId || !name) return NextResponse.json({ error: "tenantId dan name wajib" }, { status: 400 })
  try {
    await requireTenantAccess(tenantId)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 })
  }

  const tenant = await db.tenant.findUnique({ where: { id: tenantId } })
  if (tenant) {
    let effectiveQuota = tenant.studentQuota || 0
    
    // Auto-heal fallback for existing free tenants that might have 0 quota saved in DB
    if (tenant.plan === "free" && effectiveQuota === 0) {
      const freePlan = await db.subscriptionPlan.findUnique({ where: { slug: "free" } })
      effectiveQuota = freePlan?.maxStudents || 1
    }

    const studentCount = await db.student.count({ where: { tenantId } })
    if (studentCount >= effectiveQuota) {
      return NextResponse.json({ 
        error: `Kuota siswa Anda sudah penuh (maksimal ${effectiveQuota} siswa). Silakan upgrade paket untuk menambah kuota.` 
      }, { status: 403 })
    }
  }

  let userId: string | undefined = undefined

  if (email && password) {
    email = email.toLowerCase()
    const bcrypt = await import("bcryptjs")
    let user = await db.user.findUnique({ where: { email } })
    
    if (user) {
      const existingTu = await db.tenantUser.findUnique({
        where: { tenantId_userId: { tenantId, userId: user.id } },
      })
      if (existingTu && existingTu.role !== "siswa") {
        const roleMap: Record<string, string> = { guru: "Guru", orangtua: "Orang Tua", admin: "Admin", siswa: "Siswa", owner: "Owner" }
        const existingRoleLabel = roleMap[existingTu.role] || existingTu.role
        return NextResponse.json({ error: `Email ini sudah terdaftar sebagai ${existingRoleLabel}. Silakan gunakan email lain untuk membuat akun Siswa.` }, { status: 400 })
      }
      if (!existingTu) {
        await db.tenantUser.create({ data: { tenantId, userId: user.id, role: "siswa" } })
      }
      if (!(user as any).isSuperAdmin) {
        const hashedPassword = await bcrypt.hash(password, 12)
        await db.user.update({ where: { id: user.id }, data: { password: hashedPassword } })
      }
      userId = user.id
    } else {
      const hashedPassword = await bcrypt.hash(password, 12)
      const newUser = await db.user.create({
        data: { name, email, phone, password: hashedPassword },
      })
      await db.tenantUser.create({
        data: { tenantId, userId: newUser.id, role: "siswa" },
      })
      userId = newUser.id
    }
  }

  const student = await db.student.create({
    data: {
      tenantId, name, nis: nis || undefined, nisn: nisn || undefined,
      gender, birthPlace, birthDate: birthDate ? new Date(birthDate) : undefined,
      address, phone, email: email || undefined,
      fatherName, motherName, guardianName,
      classroomId: classroomId || undefined,
      userId,
    },
  })

  return NextResponse.json(student, { status: 201 })
}
