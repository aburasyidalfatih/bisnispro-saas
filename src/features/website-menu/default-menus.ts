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
    label: "Profil Sekolah",
    url: "/profil",
    order: 1,
    children: [
      { label: "Profil Lembaga", url: "/profil", order: 0 },
      { label: "Guru & Staf (GTK)", url: "/gtk", order: 1 },
      { label: "Fasilitas Sekolah", url: "/fasilitas", order: 2 },
      { label: "Program Unggulan", url: "/program", order: 3 },
      { label: "Ekstrakurikuler", url: "/ekstrakurikuler", order: 4 },
    ],
  },
  {
    label: "Informasi",
    url: "/berita",
    order: 2,
    children: [
      { label: "Pengumuman", url: "/pengumuman", order: 0 },
      { label: "Berita & Artikel", url: "/berita", order: 1 },
      { label: "Agenda & Acara", url: "/agenda", order: 2 },
      { label: "Pusat Unduhan", url: "/unduhan", order: 3 },
    ],
  },
  {
    label: "Galeri",
    url: "/gallery",
    order: 3,
    children: [
      { label: "Galeri Foto", url: "/gallery", order: 0 },
      { label: "Prestasi", url: "/prestasi", order: 1 },
      { label: "Alumni Success", url: "/alumni", order: 2 },
    ],
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
