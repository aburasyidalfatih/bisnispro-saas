import { z } from "zod";

export const createAuditLogSchema = z.object({
  tenantId: z.string().optional(),
  userId: z.string().optional(),
  action: z.string().min(1, "Aksi tidak boleh kosong"),
  entity: z.string().min(1, "Entitas tidak boleh kosong"),
  entityId: z.string().optional(),
  oldData: z.record(z.string(), z.unknown()).optional(),
  newData: z.record(z.string(), z.unknown()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

export type CreateAuditLogInput = z.infer<typeof createAuditLogSchema>;

export const getAuditLogsSchema = z.object({
  tenantId: z.string().optional(),
  userId: z.string().optional(),
  entity: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type GetAuditLogsInput = z.infer<typeof getAuditLogsSchema>;
