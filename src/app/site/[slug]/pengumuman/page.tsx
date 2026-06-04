import { PageHeader } from "@/app/site/[slug]/_components/page-header"
import { notFound } from "next/navigation"
import Link from "next/link"
import { getTenantLayoutData } from "@/features/tenant/services/tenant-modular.service"
import { getPublicBasePath } from "@/lib/utils/public-path"
import { Megaphone, ArrowRight, Search, Calendar } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { getPublicPosts, countPublicPosts } from "@/features/tenant/services/tenant-public-queries.service"
import { renderCustomTheme } from "@/app/site/[slug]/_themes/custom-renderer"

export const dynamic = 'force-dynamic';
export const revalidate = 0;




export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getTenantLayoutData(slug)
  if (!tenant) return {}
  
  const title = `Papan Pengumuman`
  const description = `Informasi penting dan pengumuman resmi dari ${tenant.name}`
  const domainUrl = tenant.domain ? `https://${tenant.domain}` : `https://${tenant.slug}.schoolpro.id`
  
  return {
    title,
    description,
    alternates: { canonical: "/pengumuman" },
    openGraph: {
      title,
      description,
      url: `${domainUrl}/pengumuman`,
    }
  }
}

export default async function PengumumanPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ slug: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { slug } = await params
  const resolvedSearchParams = await searchParams
  const page = typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page) : 1
  const perPage = 10

  const tenant = await getTenantLayoutData(slug)
  if (!tenant) notFound()

  const base = await getPublicBasePath(slug)

  // Fetch paginated pengumuman from DAL (with unstable_cache)
  const whereClause = { 
    tenantId: tenant.id, 
    status: 'PUBLISHED',
    type: { in: ["PENGUMUMAN", "PENGUMUMAN_SEMUA"] }
  }
  
  const posts = await getPublicPosts(tenant.id, page, perPage, whereClause)
  const totalPosts = await countPublicPosts(tenant.id, whereClause)
  const totalPages = Math.ceil(totalPosts / perPage)

  // Custom Theme rendering
  if (tenant.customThemeId && tenant.customTheme?.pengumumanHtml) {
    const rendered = renderCustomTheme({
      templateHtml: tenant.customTheme.pengumumanHtml,
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

  return (
    <div className="bg-background min-h-screen pb-12">
      {/* ── HERO SECTION ── */}
      <PageHeader
        title="Papan Pengumuman"
        description={<>Informasi penting dan pengumuman resmi dari {tenant.name}.</>}
        breadcrumbs={[
          { label: "Informasi" },
          { label: "Pengumuman" }
        ]}
      />

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white/50 rounded-[3rem] border border-dashed border-border/60">
             <div className="h-24 w-24 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 mb-6">
               <Megaphone className="h-10 w-10" />
             </div>
             <h3 className="text-2xl font-bold mb-2">Belum ada pengumuman</h3>
             <p className="text-muted-foreground max-w-sm text-center">Belum ada informasi pengumuman yang dipublikasikan saat ini.</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {posts.map((post: any) => (
              <Link 
                key={post.id} 
                href={`${base}/pengumuman/${post.slug}`}
                className="group flex flex-col md:flex-row bg-white rounded-3xl overflow-hidden border border-border/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative"
              >
                {/* Decoration line */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500/20 group-hover:bg-blue-600 transition-colors" />
                
                <div className="md:w-56 bg-blue-500/5 group-hover:bg-blue-600 text-blue-600 group-hover:text-white flex flex-col items-center justify-center p-8 text-center transition-colors duration-300">
                   <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-80 mb-2">
                      {format(new Date(post.createdAt), 'MMMM', { locale: id })}
                   </p>
                   <p className="text-6xl font-black leading-none mb-2">
                      {format(new Date(post.createdAt), 'dd')}
                   </p>
                   <p className="text-sm font-bold opacity-80">
                      {format(new Date(post.createdAt), 'yyyy')}
                   </p>
                </div>
                <div className="flex-1 p-8 md:p-10 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                      {post.category?.name || "INFORMASI PENTING"}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-slate-900 group-hover:text-blue-600 transition-colors">{post.title}</h3>
                  <p className="text-muted-foreground line-clamp-2 leading-relaxed">
                     {post.seoDesc || post.content.replace(/<[^>]*>/g, '').substring(0, 150) + "..."}
                  </p>
                  <div className="mt-6 flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-widest opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    Baca Selengkapnya <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </Link>
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-16">
                {page > 1 && (
                  <Link href={`${base}/pengumuman?page=${page - 1}`} className="px-4 py-2 border rounded-xl hover:bg-muted font-medium">
                    Sebelumnya
                  </Link>
                )}
                <span className="px-4 py-2 text-muted-foreground">
                  Halaman {page} dari {totalPages}
                </span>
                {page < totalPages && (
                  <Link href={`${base}/pengumuman?page=${page + 1}`} className="px-4 py-2 border rounded-xl hover:bg-muted font-medium">
                    Selanjutnya
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Info tambahan */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
         <div className="bg-blue-500/5 rounded-3xl p-8 border border-blue-500/10 flex flex-col md:flex-row items-center gap-6">
            <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
               <Search className="h-6 w-6" />
            </div>
            <div className="flex-1 text-center md:text-left">
               <h4 className="font-bold text-lg">Butuh informasi lebih detail?</h4>
               <p className="text-sm text-muted-foreground">Silakan hubungi pihak tata usaha sekolah untuk pertanyaan terkait pengumuman di atas.</p>
            </div>
            <Link href={`${base}/contact`} className="px-6 py-2.5 bg-white border border-blue-500/20 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-500/5 transition-colors">
               Hubungi Sekolah
            </Link>
         </div>
      </section>
    </div>
  )
}
