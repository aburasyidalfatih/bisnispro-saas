import { describe, expect, it } from "vitest"
import { normalizeWebsiteMenuTree } from "@/features/website-menu/menu-tree"

describe("normalizeWebsiteMenuTree", () => {
  it("merges duplicate root menus and deduplicates their children", () => {
    const menus = normalizeWebsiteMenuTree([
      {
        id: "root-newer",
        label: "Profil Perusahaan",
        url: "/profil",
        order: 2,
        createdAt: "2024-01-02T00:00:00.000Z",
        children: [
          { id: "child-gtk", label: "Staf & Staf (GTK)", url: "/gtk", order: 1 },
        ],
      },
      {
        id: "root-keeper",
        label: " Profil  Perusahaan ",
        url: "/profil/",
        order: 1,
        createdAt: "2024-01-01T00:00:00.000Z",
        children: [
          { id: "child-profile", label: "Profil Bisnis", url: "/profil", order: 0 },
          { id: "child-gtk-duplicate", label: "staf & staf (gtk)", url: "/gtk/", order: 2 },
        ],
      },
    ])

    expect(menus).toHaveLength(1)
    expect(menus[0].id).toBe("root-keeper")
    expect(menus[0].children?.map((child) => child.id)).toEqual(["child-profile", "child-gtk"])
  })

  it("keeps same-label menus when the target URL differs", () => {
    const menus = normalizeWebsiteMenuTree([
      { id: "contact", label: "Kontak", url: "/contact", order: 0 },
      { id: "contact-alt", label: "Kontak", url: "/kontak", order: 1 },
    ])

    expect(menus).toHaveLength(2)
  })
})
