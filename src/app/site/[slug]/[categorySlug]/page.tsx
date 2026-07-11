import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { getTenantLayoutData } from "@/features/tenant/services/tenant-modular.service"
import { db } from "@/lib/db"
import BeritaPage from "../berita/page"
import CustomPagePublicView, { generateMetadata as generateCustomPageMetadata } from "../pages/[pageSlug]/page"


export async function generateMetadata({ params }: { params: Promise<{ slug: string, categorySlug: string }> }) {
  const headerList = await headers();
  const rootDomain = headerList.get('x-root-domain') || process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'schoolpro.id';
  const { slug, categorySlug } = await params
  const tenant = await getTenantLayoutData(slug)
  if (!tenant) return {}
  
  const category = await db.category.findFirst({
    where: { slug: categorySlug, tenantId: tenant.id }
  })

  if (!category) {
    // Cek apakah ini custom page
    const customPage = await db.customPage.findFirst({
      where: { slug: categorySlug, tenantId: tenant.id, isPublished: true }
    })

    if (customPage) {
      return generateCustomPageMetadata({ params: Promise.resolve({ slug, pageSlug: categorySlug }) })
    }

    return {}
  }

  const title = `Kategori: ${category.name}`
  const description = `Berita dan artikel dengan kategori ${category.name} dari ${tenant.name}`
  const domainUrl = tenant.domain ? `https://${tenant.domain}` : `https://${tenant.slug}.${rootDomain}`
  
  return {
    title,
    description,
    alternates: { canonical: `/${category.slug}` },
    openGraph: {
      title,
      description,
      url: `${domainUrl}/${category.slug}`,
    }
  }
}

export default async function CategoryProxyPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ slug: string, categorySlug: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { slug, categorySlug } = await params
  const tenant = await getTenantLayoutData(slug)
  if (!tenant) notFound()

  // Verifikasi apakah categorySlug ini valid
  const category = await db.category.findFirst({
    where: { slug: categorySlug, tenantId: tenant.id }
  })

  if (!category) {
    // Cek apakah ini adalah custom page
    const customPage = await db.customPage.findFirst({
      where: { slug: categorySlug, tenantId: tenant.id, isPublished: true }
    })

    if (customPage) {
      return CustomPagePublicView({ params: Promise.resolve({ slug, pageSlug: categorySlug }) })
    }

    notFound()
  }

  // Inject categorySlug ke dalam searchParams agar komponen BeritaPage menanganinya
  const resolvedSearchParams = await searchParams
  const injectedSearchParams = Promise.resolve({
    ...resolvedSearchParams,
    category: categorySlug
  })

  // Re-use BeritaPage as a function call because it is an async Server Component
  return BeritaPage({ params: Promise.resolve({ slug }), searchParams: injectedSearchParams })
}
