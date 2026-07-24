const TENANT_SCOPED_MODEL_NAMES = new Set([
  "AffiliateCommission",
  "AiMemory",
  "AiUsageLog",
  "AuditLog",
  "Category",
  "ContactSubmission",
  "CourseEnrollment",
  "CustomPage",
  "Document",
  "Donation",
  "DonationCampaign",
  "DripLog",
  "EmailQueueLog",
  "ErrorLog",
  "Event",
  "Faq",
  "FileUpload",
  "InternalMessage",
  "Invitation",
  "Notification",
  "Office",
  "PageView",
  "Partnership",
  "Payment",
  "Popup",
  "Portfolio",
  "Post",
  "SecurityLog",
  "Service",
  "Slider",
  "SocialMediaCredential",
  "Subscription",
  "SystemFeedback",
  "TeamMember",
  "TenantGallery",
  "TenantNotification",
  "TenantScore",
  "TenantUser",
  "Testimonial",
  "WaMessage",
  "WaQueueLog",
  "WavioMessageLog",
  "WebsiteMenu",
])

const WHERE_OPERATIONS = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
  "update",
  "updateMany",
  "delete",
  "deleteMany",
  "upsert",
])

const CREATE_OPERATIONS = new Set(["create", "createMany", "createManyAndReturn"])

export function isTenantScopedModel(model: string | undefined): boolean {
  return Boolean(model && TENANT_SCOPED_MODEL_NAMES.has(model))
}

function injectTenantIdIntoData(data: unknown, tenantId: string): unknown {
  if (Array.isArray(data)) {
    return data.map((item) => injectTenantIdIntoData(item, tenantId))
  }

  if (data && typeof data === "object") {
    return { ...(data as Record<string, unknown>), tenantId }
  }

  return data
}

export function applyTenantScopeToArgs(args: unknown, operation: string, tenantId: string): unknown {
  if (!args || typeof args !== "object") return args

  const scopedArgs = args as Record<string, unknown>

  if (WHERE_OPERATIONS.has(operation)) {
    scopedArgs.where = { ...((scopedArgs.where as Record<string, unknown>) || {}), tenantId }
  }

  if (CREATE_OPERATIONS.has(operation)) {
    scopedArgs.data = injectTenantIdIntoData(scopedArgs.data, tenantId)
  }

  if (operation === "upsert") {
    scopedArgs.create = injectTenantIdIntoData(scopedArgs.create, tenantId)
  }

  return scopedArgs
}

export function assertTenantId(tenantId: string) {
  if (!tenantId) {
    throw new Error("A valid tenantId is required")
  }
}
