import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { CreateAuditLogInput, GetAuditLogsInput } from "../validations";

/**
 * Merekam log audit ke database.
 * Memastikan pemisahan data (DTO mapping) yang baik agar data mentah UI terisolasi.
 */
export async function createAuditLog(params: CreateAuditLogInput) {
  const result = await db.auditLog.create({
    data: {
      tenantId: params.tenantId,
      userId: params.userId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      oldData: params.oldData ? (params.oldData as Prisma.InputJsonValue) : Prisma.DbNull,
      newData: params.newData ? (params.newData as Prisma.InputJsonValue) : Prisma.DbNull,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
  });

  // DTO (Data Transfer Object) Mapping: Mencegah Prisma objects bocor langsung ke luar Service layer
  return {
    success: true,
    data: {
      id: result.id,
      action: result.action,
      createdAt: result.createdAt,
    },
  };
}

/**
 * Mengambil daftar log audit dengan dukungan paginasi.
 */
export async function getAuditLogs(params: GetAuditLogsInput) {
  const skip = (params.page - 1) * params.limit;

  const where: Prisma.AuditLogWhereInput = {};
  if (params.tenantId) where.tenantId = params.tenantId;
  if (params.userId) where.userId = params.userId;
  if (params.entity) where.entity = params.entity;

  const [rawLogs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: params.limit,
    }),
    db.auditLog.count({ where }),
  ]);

  // DTO Mapping: Mengamankan properti Prisma yang bisa saja bocor
  const safeData = rawLogs.map((log) => ({
    id: log.id,
    action: log.action,
    entity: log.entity,
    entityId: log.entityId,
    ipAddress: log.ipAddress,
    user: log.user ? { name: log.user.name, email: log.user.email } : null,
    createdAt: log.createdAt.toISOString(),
  }));

  return {
    data: safeData,
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.ceil(total / params.limit),
  };
}
