import { PageHeader } from "@/app/site/[slug]/_components/page-header"
import { notFound } from "next/navigation"
import { getTenantLayoutData } from "@/features/tenant/services/tenant-modular.service"
import { getPublicBasePath } from "@/lib/utils/public-path"
import { db } from "@/lib/db"
import Image from "next/image"
import Link from "next/link"
import { Calendar, User, ArrowRight, BookOpen } from "lucide-react"



import { format } from "date-fns"
import { id } from "date-fns/locale"
import { cn, normalizeImageUrl } from "@/lib/utils"

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function SmartPlaceholder({ title, type }: { title: string, type: string }) {
  const hash = title.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const hue1 = hash % 360
  const hue2 = (hash + 60) % 360
  return (
    <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-6 overflow-hidden" 
         style={{ background: `linear-gradient(135deg, hsl(${hue1}, 70%, 90%), hsl(${hue2}, 70%, 85%))` }}>
      <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, black 2px, transparent 0)", backgroundSize: "32px 32px" }} />
      <div className="relative z-10 w-16 h-16 rounded-full bg-white/40 backdrop-blur-md flex items-center justify-center mb-3 shadow-sm border border-white/50">
        <Image className="opacity-40" src="/logo-schoolpro.png" alt="Logo" width={32} height={32} />
      </div>
      <p className="relative z-10 text-center font-bold text-foreground/60 text-lg sm:text-xl line-clamp-2 max-w-[80%] leading-tight mix-blend-color-burn">{title}</p>
    </div>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getTenantLayoutData(slug)
  if (!tenant) return {}
  
  const title = `Artikel & Berita Terbaru`
  const description = `Kumpulan informasi, berita, dan artikel terbaru dari ${tenant.name}`
  const domainUrl = tenant.domain ? `https://${tenant.domain}` : `https://${tenant.slug}.schoolpro.id`
  
  return {
    title,
    description,
    alternates: { canonical: "/berita" },
    openGraph: {
      title,
      description,
      url: `${domainUrl}/berita`,
    }
  }
}

export default async function BeritaPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ slug: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { slug } = await params
  const resolvedSearchParams = await searchParams
  const typeFilter = typeof resolvedSearchParams.type === 'string' ? resolvedSearchParams.type.toUpperCase() : null
  const categoryFilter = typeof resolvedSearchParams.category === 'string' ? resolvedSearchParams.category : null
  const page = typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page) : 1
  const perPage = 9

  const tenant = await getTenantLayoutData(slug)
  if (!tenant) notFound()

  const base = await getPublicBasePath(slug)

  const excludedTypes = ["PENGUMUMAN_SEMUA", "PENGUMUMAN_GTK", "PENGUMUMAN_ORTU", "PENGUMUMAN_SISWA", "PENGUMUMAN"]

  // Ambil kategori yang sudah memiliki artikel terpublikasi
  const activeCategories = await db.category.findMany({
    where: {
      tenantId: tenant.id,
      posts: {
        some: {
          status: 'PUBLISHED',
          type: { notIn: excludedTypes }
        }
      }
    },
    select: { id: true, name: true, slug: true },
    orderBy: { name: 'asc' }
  })

  const whereClause: any = { 
    tenantId: tenant.id, 
    status: 'PUBLISHED',
    type: typeFilter ? typeFilter : { notIn: excludedTypes }
  }

  if (categoryFilter) {
    whereClause.category = { slug: categoryFilter }
  }

  // Fetch paginated posts directly from DB
  const posts = await db.post.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * perPage,
    take: perPage,
    include: {
      category: true,
      author: {
        select: {
          name: true,
          avatar: true
        }
      }
    }
  })

  const totalPosts = await db.post.count({
    where: whereClause
  })
  const totalPages = Math.ceil(totalPosts / perPage)
  
  // Custom Theme rendering
  if (tenant.customThemeId && tenant.customTheme?.newsHtml) {
    const { renderCustomTheme } = await import("@/app/site/[slug]/_themes/custom-renderer")
    const rendered = renderCustomTheme({
      templateHtml: tenant.customTheme.newsHtml,
      layoutHtml: tenant.customTheme.layoutHtml,
      customCss: tenant.customTheme.customCss,
      customJs: tenant.customTheme.customJs,
      context: { 
        tenant: { ...tenant, posts }, 
        base, 
        settings: tenant.settings || {},
        pagination: { page, totalPages, hasNext: page < totalPages, hasPrev: page > 1 }
      },
    })
    if (rendered) return rendered
  }
  


  const activeCategoryName = categoryFilter ? activeCategories.find(c => c.slug === categoryFilter)?.name : null
  const pageTitle = activeCategoryName ? `Kategori: ${activeCategoryName}` : (typeFilter === 'PENGUMUMAN' ? "Pengumuman Terbaru" : "Artikel & Berita Terbaru")
  const breadcrumbLabel = typeFilter === 'PENGUMUMAN' ? "Pengumuman" : "Berita"

  return (
    <div className="bg-background min-h-screen pb-12">
      <PageHeader
        title={pageTitle}
        description={<>Ikuti informasi terkini mengenai kegiatan, prestasi, dan pengumuman di {tenant.name}.</>}
        breadcrumbs={[
          { label: "Informasi" },
          { label: breadcrumbLabel }
        ]}
      />

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Category Pills Filter */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-10 md:mb-14">
          <Link
            href={`${base}/berita`}
            className={cn(
              "px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300",
              !categoryFilter && !typeFilter
                ? "bg-primary text-white shadow-lg shadow-primary/25 scale-105"
                : "bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent hover:border-border/50"
            )}
          >
            Semua
          </Link>
          {activeCategories.map((cat) => {
            const isActive = categoryFilter === cat.slug
            const href = `${base}/berita?category=${cat.slug}`
            return (
              <Link
                key={cat.id}
                href={href}
                className={cn(
                  "px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300",
                  isActive
                    ? "bg-primary text-white shadow-lg shadow-primary/25 scale-105"
                    : "bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent hover:border-border/50"
                )}
              >
                {cat.name}
              </Link>
            )
          })}
        </div>

        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white/50 rounded-[3rem] border border-dashed border-border/60">
             <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
               <Calendar className="h-10 w-10" />
             </div>
             <h3 className="text-2xl font-bold mb-2">Belum ada {pageTitle.toLowerCase()}</h3>
             <p className="text-muted-foreground max-w-sm text-center">Informasi terbaru akan segera dipublikasikan oleh pihak sekolah. Pantau terus halaman ini.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Hero Post */}
            {posts[0] && (
              <Link 
                href={`${base}/berita/${posts[0].slug}`}
                className="group relative flex flex-col lg:flex-row bg-white rounded-[2.5rem] overflow-hidden border border-border/50 hover:shadow-2xl transition-all duration-500"
              >
                <div className="w-full lg:w-3/5 aspect-[16/10] lg:aspect-auto relative overflow-hidden bg-muted">
                  {normalizeImageUrl(posts[0].featuredImage) ? (
                    <Image src={normalizeImageUrl(posts[0].featuredImage)!} alt={posts[0].title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <SmartPlaceholder title={posts[0].title} type={posts[0].type || "BERITA"} />
                  )}
                  <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm text-primary text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                     TERBARU
                  </div>
                </div>
                <div className="w-full lg:w-2/5 p-8 lg:p-12 flex flex-col justify-center">
                  <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
                    <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {format(new Date(posts[0].createdAt), 'dd MMM yyyy', { locale: id })}</span>
                  </div>
                  <h3 className="text-3xl lg:text-4xl font-extrabold mb-6 leading-tight group-hover:text-primary transition-colors line-clamp-3">
                    {posts[0].title}
                  </h3>
                  <p className="text-muted-foreground text-lg leading-relaxed mb-8 line-clamp-4">
                    {posts[0].seoDesc || posts[0].content.replace(/<[^>]*>/g, '').substring(0, 200) + "..."}
                  </p>
                  <div className="inline-flex items-center gap-3 text-white bg-primary px-6 py-3 rounded-full font-bold text-sm w-fit group-hover:shadow-lg transition-all">
                    Baca Selengkapnya <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            )}

            {/* Grid for remaining posts */}
            {posts.length > 1 && (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 pt-8 border-t border-border/50">
                {posts.slice(1).map((post: any) => (
                  <Link 
                    key={post.id} 
                    href={`${base}/berita/${post.slug}`}
                    className="group flex flex-col bg-white rounded-3xl overflow-hidden border border-border/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="aspect-[16/10] relative overflow-hidden bg-muted">
                      {normalizeImageUrl(post.featuredImage) ? (
                        <Image src={normalizeImageUrl(post.featuredImage)!} alt={post.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <SmartPlaceholder title={post.title} type={post.type || "BERITA"} />
                      )}
                      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                         {post.type || "BERITA"}
                      </div>
                    </div>
                    <div className="p-8 flex-1 flex flex-col">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4 font-medium">
                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {format(new Date(post.createdAt), 'dd MMM yyyy', { locale: id })}</span>
                      </div>
                      <h3 className="text-xl font-bold mb-3 line-clamp-2 leading-snug group-hover:text-primary transition-colors">{post.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed mb-6 flex-1">
                        {post.seoDesc || post.content.replace(/<[^>]*>/g, '').substring(0, 120) + "..."}
                      </p>
                      <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                        Selengkapnya <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-16">
                  {page > 1 && (
                    <Link href={`${base}/berita?page=${page - 1}${typeFilter ? `&type=${typeFilter}` : ''}`} className="px-4 py-2 border rounded-xl hover:bg-muted font-medium">
                      Sebelumnya
                    </Link>
                  )}
                  <span className="px-4 py-2 text-muted-foreground">
                    Halaman {page} dari {totalPages}
                  </span>
                  {page < totalPages && (
                    <Link href={`${base}/berita?page=${page + 1}${typeFilter ? `&type=${typeFilter}` : ''}`} className="px-4 py-2 border rounded-xl hover:bg-muted font-medium">
                      Selanjutnya
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    )
  }
