import type { Prisma } from "@/lib/db"

type WebsiteMenuClient = Pick<Prisma.TransactionClient, "websiteMenu">

type DefaultWebsiteMenuItem = {
  label: string
  url: string
  order: number
  isSystem?: boolean
  children?: Omit<DefaultWebsiteMenuItem, "children">[]
}

export const DEFAULT_WEBSITE_MENU_TREE: DefaultWebsiteMenuItem[] = [
  { label: "Beranda", url: "/", order: 0, isSystem: true },
  {
    label: "Profil Perusahaan",
    url: "/tentang",
    order: 1,
    children: [
      { label: "Tentang Kami", url: "/tentang", order: 0 },
      { label: "Tim Kami", url: "/tim", order: 1 },
      { label: "Layanan", url: "/layanan", order: 2 },
      { label: "Portofolio", url: "/portofolio", order: 3 },
    ],
  },
  {
    label: "Informasi",
    url: "/blog",
    order: 2,
    children: [
      { label: "Blog", url: "/blog", order: 0 },
      { label: "Agenda", url: "/event", order: 1 },
      { label: "Pusat Unduhan", url: "/download", order: 2 },
    ],
  },
  {
    label: "Galeri",
    url: "/gallery",
    order: 3,
  },
  { label: "Kontak", url: "/contact", order: 4 },
]

export async function createDefaultWebsiteMenus(client: WebsiteMenuClient, tenantId: string) {
  for (const item of DEFAULT_WEBSITE_MENU_TREE) {
    const parent = await client.websiteMenu.create({
      data: {
        tenantId,
        label: item.label,
        url: item.url,
        order: item.order,
        isSystem: item.isSystem ?? false,
      },
    })

    if (item.children?.length) {
      await client.websiteMenu.createMany({
        data: item.children.map((child) => ({
          tenantId,
          label: child.label,
          url: child.url,
          parentId: parent.id,
          order: child.order,
          isSystem: child.isSystem ?? false,
        })),
      })
    }
  }
}
