import { PageHeader } from "@/app/site/[slug]/_components/page-header"
import { notFound } from "next/navigation"
import { getPublicTenantBySlug } from "@/lib/services/tenant-public"
import { getPublicBasePath } from "@/lib/utils/public-path"
import { db } from "@/lib/db"
import Image from "next/image"
import Link from "next/link"
import { Calendar, User, ArrowRight } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

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
  const page = typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page) : 1
  const perPage = 9

  const tenant = await getPublicTenantBySlug(slug)
  if (!tenant) notFound()

  const base = await getPublicBasePath(slug)
  
  // Fetch paginated posts directly from DB
  const posts = await db.post.findMany({
    where: { 
      tenantId: tenant.id, 
      status: 'PUBLISHED',
      ...(typeFilter ? { type: typeFilter } : {})
    },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * perPage,
    take: perPage,
  })

  const totalPosts = await db.post.count({
    where: { 
      tenantId: tenant.id, 
      status: 'PUBLISHED',
      ...(typeFilter ? { type: typeFilter } : {})
    }
  })
  const totalPages = Math.ceil(totalPosts / perPage)
  


  const pageTitle = typeFilter === 'PENGUMUMAN' ? "Pengumuman Terbaru" : "Artikel & Berita Terbaru"
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

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
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
                href={`${base}/berita/${posts[0].id}`}
                className="group relative flex flex-col lg:flex-row bg-white rounded-[2.5rem] overflow-hidden border border-border/50 hover:shadow-2xl transition-all duration-500"
              >
                <div className="w-full lg:w-3/5 aspect-[16/10] lg:aspect-auto relative overflow-hidden bg-muted">
                  {posts[0].image ? (
                    <Image src={posts[0].image} alt={posts[0].title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-primary/5">
                       <span className="text-primary/20 font-bold text-4xl">NO IMAGE</span>
                    </div>
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
                    {posts[0].excerpt || posts[0].content.replace(/<[^>]*>/g, '').substring(0, 200) + "..."}
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
                    href={`${base}/berita/${post.id}`}
                    className="group flex flex-col bg-white rounded-3xl overflow-hidden border border-border/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="aspect-[16/10] relative overflow-hidden bg-muted">
                      {post.image ? (
                        <Image src={post.image} alt={post.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-primary/5 text-primary/20 font-bold">NO IMAGE</div>
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
                        {post.excerpt || post.content.replace(/<[^>]*>/g, '').substring(0, 120) + "..."}
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
