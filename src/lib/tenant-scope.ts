const TENANT_SCOPED_MODEL_NAMES = new Set([
  "Achievement",
  "AffiliateCommission",
  "AiMemory",
  "AiUsageLog",
  "Alumni",
  "AttendancePermit",
  "AttendanceRecord",
  "AttendanceSession",
  "AuditLog",
  "BillingType",
  "CanteenMerchant",
  "CanteenOrder",
  "CanteenProduct",
  "CanteenWithdrawal",
  "Cashflow",
  "Category",
  "CbtExam",
  "CbtQuestionBank",
  "Classroom",
  "ContactSubmission",
  "CourseEnrollment",
  "DisciplineRecord",
  "Document",
  "Donation",
  "DonationCampaign",
  "DripLog",
  "ErrorLog",
  "Event",
  "Extracurricular",
  "Facility",
  "FileUpload",
  "Grade",
  "Installment",
  "InternalMessage",
  "Invitation",
  "Invoice",
  "InvoicePayment",
  "Notification",
  "PageView",
  "Partnership",
  "Payment",
  "PendaftarPpdb",
  "PeriodePpdb",
  "Popup",
  "Post",
  "Program",
  "Rekening",
  "Schedule",
  "SecurityLog",
  "Slider",
  "Staff",
  "StaffAttendance",
  "StaffPermit",
  "Student",
  "Subject",
  "Subscription",
  "SystemFeedback",
  "TeacherJournal",
  "TenantGallery",
  "TenantNotification",
  "TenantScore",
  "TenantUser",
  "SocialMediaCredential",
  "WaMessage",
  "WaQueueLog",
  "WalletAccount",
  "WalletTransaction",
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
