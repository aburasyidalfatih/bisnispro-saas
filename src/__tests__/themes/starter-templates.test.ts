import Handlebars from "handlebars"
import { describe, expect, it } from "vitest"
import * as starterTemplates from "@/features/themes/constants/starter-templates"

describe("SchoolPro theme starter templates", () => {
  it("keeps every generated Handlebars template syntactically valid", () => {
    const templates = Object.entries(starterTemplates).filter(([key]) => (
      key.startsWith("LAYOUT_") || key.startsWith("TEMPLATE_")
    ))

    expect(templates.length).toBeGreaterThan(0)

    for (const [key, template] of templates) {
      expect(() => Handlebars.precompile(String(template)), key).not.toThrow()
    }
  })

  it("documents the canonical upload structure", () => {
    expect(starterTemplates.STARTER_README).toContain("layouts/")
    expect(starterTemplates.STARTER_README).toContain("templates/")
    expect(starterTemplates.STARTER_README).toContain("assets/")
  })
})
