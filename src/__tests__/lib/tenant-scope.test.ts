import { describe, expect, it } from "vitest"
import { applyTenantScopeToArgs, isTenantScopedModel } from "@/lib/tenant-scope"

describe("tenant scope helpers", () => {
  it("detects only models with tenantId as tenant-scoped", () => {
    expect(isTenantScopedModel("Service")).toBe(true)
    expect(isTenantScopedModel("Portfolio")).toBe(true)
    expect(isTenantScopedModel("WebsiteMenu")).toBe(true)
    expect(isTenantScopedModel("TeamMember")).toBe(true)
    expect(isTenantScopedModel("User")).toBe(false)
    expect(isTenantScopedModel(undefined)).toBe(false)
  })

  it("injects tenantId into where clauses", () => {
    const args = { where: { id: "service-1" } }

    expect(applyTenantScopeToArgs(args, "findFirst", "tenant-1")).toEqual({
      where: { id: "service-1", tenantId: "tenant-1" },
    })
  })

  it("injects tenantId into create data", () => {
    const args = { data: { name: "Klien A" } }

    expect(applyTenantScopeToArgs(args, "create", "tenant-1")).toEqual({
      data: { name: "Klien A", tenantId: "tenant-1" },
    })
  })

  it("injects tenantId into createMany array data", () => {
    const args = { data: [{ name: "A" }, { name: "B", tenantId: "old" }] }

    expect(applyTenantScopeToArgs(args, "createMany", "tenant-1")).toEqual({
      data: [
        { name: "A", tenantId: "tenant-1" },
        { name: "B", tenantId: "tenant-1" },
      ],
    })
  })

  it("injects tenantId into upsert where and create data", () => {
    const args = {
      where: { id: "payment-1" },
      create: { amount: 1000 },
      update: { amount: 2000 },
    }

    expect(applyTenantScopeToArgs(args, "upsert", "tenant-1")).toEqual({
      where: { id: "payment-1", tenantId: "tenant-1" },
      create: { amount: 1000, tenantId: "tenant-1" },
      update: { amount: 2000 },
    })
  })
})
