"use server"

import { db } from "@/lib/db"
import { Prisma } from "@prisma/client"

export async function getSchoolsDirectory(params: {
  search?: string
  province?: string
  regency?: string
  page?: number
}) {
  const { search, province, regency, page = 1 } = params
  const limit = 24
  const skip = (page - 1) * limit

  try {
    let whereClause: Prisma.TenantWhereInput = {
      isActive: true,
      plan: { not: "" }, // Ensure only valid tenants
    }

    if (search) {
      whereClause.name = {
        contains: search,
        mode: "insensitive"
      }
    }

    // Array of conditions to support json filtering
    const AND: Prisma.TenantWhereInput[] = []

    if (province) {
      AND.push({
        settings: {
          path: ['province'],
          equals: province,
        }
      })
    }

    if (regency) {
      AND.push({
        settings: {
          path: ['regency'],
          equals: regency,
        }
      })
    }

    if (AND.length > 0) {
      whereClause.AND = AND
    }

    const [total, schools] = await Promise.all([
      db.tenant.count({ where: whereClause }),
      db.tenant.findMany({
        where: whereClause,
        orderBy: {
          tenantScore: {
            totalScore: 'desc'
          }
        },
        include: {
          tenantScore: true,
        },
        skip,
        take: limit,
      })
    ])

    return {
      schools: schools.map(s => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        domain: s.domain,
        logo: s.logo,
        province: (s.settings as any)?.province || "",
        regency: (s.settings as any)?.regency || "",
      })),
      total,
      totalPages: Math.ceil(total / limit)
    }
  } catch (error) {
    console.error("Failed to fetch schools directory:", error)
    
    // Fallback if Prisma JSON path filtering fails due to dialect mismatch
    try {
      console.log("Attempting fallback string contains...")
      let whereClause: Prisma.TenantWhereInput = { isActive: true }
      if (search) whereClause.name = { contains: search, mode: "insensitive" }
      
      const andConditions: Prisma.TenantWhereInput[] = []
      if (province) andConditions.push({ settings: { string_contains: province } })
      if (regency) andConditions.push({ settings: { string_contains: regency } })
      
      if (andConditions.length > 0) whereClause.AND = andConditions

      const fallbackSchools = await db.tenant.findMany({
        where: whereClause,
        orderBy: { tenantScore: { totalScore: 'desc' } },
        include: { tenantScore: true },
        skip,
        take: limit,
      })
      
      const total = await db.tenant.count({ where: whereClause })
      
      return {
        schools: fallbackSchools.map(s => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          domain: s.domain,
          logo: s.logo,
          province: (s.settings as any)?.province || "",
          regency: (s.settings as any)?.regency || "",
        })),
        total,
        totalPages: Math.ceil(total / limit)
      }
    } catch (fallbackErr) {
       console.error("Fallback failed:", fallbackErr)
       return { schools: [], total: 0, totalPages: 0 }
    }
  }
}
