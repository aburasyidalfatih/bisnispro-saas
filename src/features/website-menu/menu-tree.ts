export type WebsiteMenuTreeItem = {
  id: string
  label: string
  url: string
  icon?: string | null
  order: number
  parentId?: string | null
  createdAt?: Date | string | number | null
  children?: WebsiteMenuTreeItem[] | null
}

export function normalizeWebsiteMenuLabel(label: string) {
  return label.trim().replace(/\s+/g, " ")
}

export function normalizeWebsiteMenuUrl(url: string) {
  const trimmed = url.trim()
  if (trimmed === "" || trimmed === "/") return "/"

  return trimmed.replace(/\/+$/, "") || "/"
}

export function getWebsiteMenuIdentityKey(menu: Pick<WebsiteMenuTreeItem, "label" | "url">) {
  return `${normalizeWebsiteMenuLabel(menu.label).toLowerCase()}\u0000${normalizeWebsiteMenuUrl(menu.url).toLowerCase()}`
}

function menuCreatedAtValue(value: WebsiteMenuTreeItem["createdAt"]) {
  if (value instanceof Date) return value.getTime()
  if (typeof value === "number") return value
  if (typeof value === "string") {
    const parsed = Date.parse(value)
    return Number.isNaN(parsed) ? 0 : parsed
  }
  return 0
}

function compareWebsiteMenus(a: WebsiteMenuTreeItem, b: WebsiteMenuTreeItem) {
  const orderDiff = (a.order ?? 0) - (b.order ?? 0)
  if (orderDiff !== 0) return orderDiff

  const createdAtDiff = menuCreatedAtValue(a.createdAt) - menuCreatedAtValue(b.createdAt)
  if (createdAtDiff !== 0) return createdAtDiff

  return a.id.localeCompare(b.id)
}

function normalizeWebsiteMenuLevel<T extends WebsiteMenuTreeItem>(menus: readonly T[]): T[] {
  const groupedMenus = new Map<string, { menu: T; children: T[] }>()

  for (const menu of [...menus].sort(compareWebsiteMenus)) {
    const key = getWebsiteMenuIdentityKey(menu)
    const children = Array.isArray(menu.children) ? menu.children : []
    const existing = groupedMenus.get(key)

    if (existing) {
      existing.children.push(...(children as T[]))
      continue
    }

    groupedMenus.set(key, { menu, children: [...(children as T[])] })
  }

  return [...groupedMenus.values()]
    .sort((a, b) => compareWebsiteMenus(a.menu, b.menu))
    .map(({ menu, children }) => ({
      ...menu,
      children: normalizeWebsiteMenuLevel(children),
    }) as T)
}

export function normalizeWebsiteMenuTree<T extends WebsiteMenuTreeItem>(menus: readonly T[] | null | undefined): T[] {
  if (!Array.isArray(menus)) return []
  return normalizeWebsiteMenuLevel(menus)
}
