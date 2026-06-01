import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

// ==========================================
// Query: Daftar Tenant (Super Admin)
// ==========================================
export async function getTenantsForSuperAdmin(params: {
  page: number
  limit: number
  search: string
  sort: string
  order: string
}) {
  const { page, limit, search, sort, order } = params

  const where: any = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { slug: { contains: search, mode: "insensitive" } },
          { users: { some: { role: "owner", user: { email: { contains: search, mode: "insensitive" } } } } }
        ]
      }
    : {}

  if (sort === "storage") {
    // Optimized: Only fetch IDs to prevent OOM
    const matchingTenants = await db.tenant.findMany({
      where,
      select: { id: true }
    })
    const tenantIds = matchingTenants.map(t => t.id)
    const total = tenantIds.length

    // Get storage usage for these tenants
    const storageGroups = await db.fileUpload.groupBy({
      by: ['tenantId'],
      where: { tenantId: { in: tenantIds } },
      _sum: { size: true }
    })
    
    const storageMap = new Map()
    tenantIds.forEach(id => storageMap.set(id, 0)) // Init with 0
    storageGroups.forEach(g => {
      if (g.tenantId) storageMap.set(g.tenantId, g._sum.size || 0)
    })

    // Sort IDs by storage
    const sortedTenantIds = [...tenantIds].sort((a, b) => {
      const sizeA = storageMap.get(a)
      const sizeB = storageMap.get(b)
      if (order === "asc") return sizeA - sizeB
      return sizeB - sizeA
    })

    // Paginate IDs
    const paginatedIds = sortedTenantIds.slice((page - 1) * limit, page * limit)

    // Fetch full data ONLY for paginated IDs
    const paginatedTenants = await db.tenant.findMany({
      where: { id: { in: paginatedIds } },
      include: {
        _count: { select: { users: true } },
        users: {
          where: { role: "owner" },
          include: { user: { select: { name: true, email: true, phone: true } } },
          take: 1,
        },
      },
    })

    // Re-order to match paginatedIds
    const tenantDataMap = new Map()
    paginatedTenants.forEach(t => tenantDataMap.set(t.id, t))

    const result = paginatedIds.map(id => {
      const t = tenantDataMap.get(id)
      if (!t) return null
      return {
        id: t.id, name: t.name, slug: t.slug, domain: t.domain,
        plan: t.plan, theme: t.theme, isActive: t.isActive, createdAt: t.createdAt,
        studentQuota: t.studentQuota, aiTokens: t.aiTokens, aiAddonTokens: t.aiAddonTokens,
        userCount: t._count.users, owner: t.users[0]?.user || null,
        storageUsed: storageMap.get(t.id) || 0
      }
    }).filter(Boolean)

    return { data: result, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  // Default sorting (createdAt)
  const [data, total] = await Promise.all([
    db.tenant.findMany({
      where,
      include: {
        _count: { select: { users: true } },
        users: {
          where: { role: "owner" },
          include: { user: { select: { name: true, email: true, phone: true } } },
          take: 1,
        },
      },
      orderBy: { [sort === "plan" ? "plan" : "createdAt"]: order as any },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.tenant.count({ where }),
  ])

  const tenantIds = data.map(t => t.id)
  const storageGroups = await db.fileUpload.groupBy({
    by: ['tenantId'],
    where: { tenantId: { in: tenantIds } },
    _sum: { size: true }
  })
  const storageMap = new Map()
  storageGroups.forEach(g => {
    if (g.tenantId) storageMap.set(g.tenantId, g._sum.size || 0)
  })

  const result = data.map((t) => ({
    id: t.id, name: t.name, slug: t.slug, domain: t.domain,
    plan: t.plan, theme: t.theme, isActive: t.isActive, createdAt: t.createdAt,
    studentQuota: t.studentQuota, aiTokens: t.aiTokens, aiAddonTokens: t.aiAddonTokens,
    userCount: t._count.users, owner: t.users[0]?.user || null,
    storageUsed: storageMap.get(t.id) || 0
  }))

  return { data: result, total, page, limit, totalPages: Math.ceil(total / limit) }
}

// ==========================================
// Mutation: Update Tenant (Super Admin)
// ==========================================
export async function updateTenantByAdmin(id: string, data: {
  name?: string
  slug?: string
  domain?: string | null
  plan?: string
  isActive?: boolean
  studentQuota?: number
  aiTokens?: number
}) {
  try {
    const existing = await db.tenant.findUnique({
      where: { id },
      select: { slug: true }
    })

    const updated = await db.tenant.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        domain: data.domain || null,
        plan: data.plan,
        isActive: data.isActive,
        studentQuota: Number(data.studentQuota || 0),
        aiTokens: Number(data.aiTokens || 0)
      }
    })

    if (existing?.slug) {
      const { invalidatePublicTenantCache } = await import("@/features/tenant/services/tenant-public.service")
      await invalidatePublicTenantCache(existing.slug)
    }
    if (updated.slug !== existing?.slug) {
      const { invalidatePublicTenantCache } = await import("@/features/tenant/services/tenant-public.service")
      await invalidatePublicTenantCache(updated.slug)
    }

    return { success: true, data: updated }
  } catch (error) {
    const prismaError = error as any
    if (prismaError?.code === 'P2002') {
      throw new Error("Slug atau Domain sudah digunakan")
    }
    logger.error("Tenant update failed", error, { tenantId: id })
    throw new Error("Gagal mengupdate tenant")
  }
}

// ==========================================
// Mutation: Delete Tenant (Super Admin)
// ==========================================
export async function deleteTenantByAdmin(tenantId: string) {
  const existing = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { slug: true }
  })

  await db.tenant.delete({ where: { id: tenantId } })

  if (existing?.slug) {
    const { invalidatePublicTenantCache } = await import("@/features/tenant/services/tenant-public.service")
    await invalidatePublicTenantCache(existing.slug)
  }

  return { message: "Tenant dihapus" }
}

// ==========================================
// Query: Payments (Super Admin)
// ==========================================
export async function getPaymentsForSuperAdmin(params: {
  page: number
  limit: number
  search: string
  statusFilter?: string | null
}) {
  const { page, limit, search, statusFilter } = params

  const where: any = {}

  if (statusFilter && statusFilter !== "all") {
    where.status = statusFilter
  }

  if (search) {
    where.OR = [
      { reference: { contains: search, mode: "insensitive" } },
      { tenant: { name: { contains: search, mode: "insensitive" } } },
      { tenant: { slug: { contains: search, mode: "insensitive" } } }
    ]
  }

  const [payments, total] = await Promise.all([
    db.payment.findMany({
      where,
      include: {
        tenant: {
          select: { name: true, slug: true }
        }
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.payment.count({ where })
  ])

  const totalRevenue = await db.payment.aggregate({
    _sum: { amount: true },
    where: { status: "paid" }
  })

  const pendingCount = await db.payment.count({
    where: { status: "pending" }
  })

  return {
    payments,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    stats: {
      totalRevenue: totalRevenue._sum.amount || 0,
      pendingCount
    }
  }
}
