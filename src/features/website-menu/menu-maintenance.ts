import type { Prisma } from "@/lib/db"
import { getWebsiteMenuIdentityKey, type WebsiteMenuTreeItem } from "./menu-tree"

type WebsiteMenuMaintenanceClient = Pick<Prisma.TransactionClient, "websiteMenu">

type WebsiteMenuRow = Pick<WebsiteMenuTreeItem, "id" | "label" | "url" | "parentId" | "order" | "createdAt">

function compareWebsiteMenuRows(a: WebsiteMenuRow, b: WebsiteMenuRow) {
  const orderDiff = (a.order ?? 0) - (b.order ?? 0)
  if (orderDiff !== 0) return orderDiff

  const aCreatedAt = a.createdAt instanceof Date ? a.createdAt.getTime() : Date.parse(String(a.createdAt ?? ""))
  const bCreatedAt = b.createdAt instanceof Date ? b.createdAt.getTime() : Date.parse(String(b.createdAt ?? ""))
  const createdAtDiff = (Number.isNaN(aCreatedAt) ? 0 : aCreatedAt) - (Number.isNaN(bCreatedAt) ? 0 : bCreatedAt)
  if (createdAtDiff !== 0) return createdAtDiff

  return a.id.localeCompare(b.id)
}

function groupDuplicateSiblings(menus: WebsiteMenuRow[]) {
  const groups = new Map<string, WebsiteMenuRow[]>()

  for (const menu of menus) {
    const key = getWebsiteMenuIdentityKey(menu)
    const group = groups.get(key) ?? []
    group.push(menu)
    groups.set(key, group)
  }

  return [...groups.values()]
    .map((group) => group.sort(compareWebsiteMenuRows))
    .filter((group) => group.length > 1)
}

function collectDescendantIds(menus: WebsiteMenuRow[], rootIds: string[]) {
  const childrenByParent = new Map<string, string[]>()

  for (const menu of menus) {
    if (!menu.parentId) continue
    const children = childrenByParent.get(menu.parentId) ?? []
    children.push(menu.id)
    childrenByParent.set(menu.parentId, children)
  }

  const ids = new Set<string>()
  const visit = (menuId: string) => {
    if (ids.has(menuId)) return
    ids.add(menuId)

    for (const childId of childrenByParent.get(menuId) ?? []) {
      visit(childId)
    }
  }

  for (const rootId of rootIds) visit(rootId)
  return [...ids]
}

async function findTenantMenus(client: WebsiteMenuMaintenanceClient, tenantId: string) {
  return client.websiteMenu.findMany({
    where: { tenantId },
    select: {
      id: true,
      label: true,
      url: true,
      parentId: true,
      order: true,
      createdAt: true,
    },
  })
}

export async function removeDuplicateWebsiteMenus(client: WebsiteMenuMaintenanceClient, tenantId: string) {
  const rootGroups = groupDuplicateSiblings((await findTenantMenus(client, tenantId)).filter((menu) => menu.parentId === null))
  let removedCount = 0

  for (const group of rootGroups) {
    const [keeper, ...duplicates] = group
    const duplicateIds = duplicates.map((menu) => menu.id)

    await client.websiteMenu.updateMany({
      where: { tenantId, parentId: { in: duplicateIds } },
      data: { parentId: keeper.id },
    })

    const deleted = await client.websiteMenu.deleteMany({
      where: { tenantId, id: { in: duplicateIds } },
    })
    removedCount += deleted.count
  }

  const menusAfterRootCleanup = await findTenantMenus(client, tenantId)
  const childrenByParent = new Map<string, WebsiteMenuRow[]>()

  for (const menu of menusAfterRootCleanup) {
    if (!menu.parentId) continue
    const siblings = childrenByParent.get(menu.parentId) ?? []
    siblings.push(menu)
    childrenByParent.set(menu.parentId, siblings)
  }

  const duplicateChildRootIds = [...childrenByParent.values()].flatMap((siblings) => (
    groupDuplicateSiblings(siblings).flatMap((group) => group.slice(1).map((menu) => menu.id))
  ))

  if (duplicateChildRootIds.length > 0) {
    const idsToDelete = collectDescendantIds(menusAfterRootCleanup, duplicateChildRootIds)

    await client.websiteMenu.updateMany({
      where: { tenantId, id: { in: idsToDelete } },
      data: { parentId: null },
    })

    const deleted = await client.websiteMenu.deleteMany({
      where: { tenantId, id: { in: idsToDelete } },
    })
    removedCount += deleted.count
  }

  return { removedCount }
}
