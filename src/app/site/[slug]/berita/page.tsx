import { PageHeader } from "@/app/site/[slug]/_components/page-header"
import { notFound } from "next/navigation"
import { getPublicTenantBySlug } from "@/lib/services/tenant-public"
import { getPublicBasePath } from "@/lib/utils/public-path"
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

  const tenant = await getPublicTenantBySlug(slug)
  if (!tenant) notFound()

  const base = await getPublicBasePath(slug)
  let posts = tenant.posts || []
  
  if (typeFilter) {
    posts = posts.filter((p: any) => p.type === typeFilter)
  }

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
          <div className="text-center py-20 bg-muted/30 rounded-[40px] border-2 border-dashed">
             <p className="text-muted-foreground">Belum ada artikel yang diterbitkan.</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post: any) => (
              <Link 
                key={post.id} 
                href={`${base}/berita/${post.id}`}
                className="group flex flex-col bg-background rounded-3xl overflow-hidden border hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
              >
                <div className="aspect-[16/10] relative overflow-hidden bg-muted">
                  {post.image ? (
                    <Image src={post.image} alt={post.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground opacity-20">No Image</div>
                  )}
                  <div className="absolute top-4 left-4 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                     BERITA
                  </div>
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex items-center gap-4 text-[11px] text-muted-foreground mb-4">
                    <div className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {format(new Date(post.createdAt), 'dd MMMM yyyy', { locale: id })}</div>
                    <div className="flex items-center gap-1.5"><User className="h-3 w-3" /> Admin</div>
                  </div>
                  <h3 className="text-xl font-bold mb-4 line-clamp-2 leading-tight group-hover:text-primary transition-colors">{post.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed mb-6 flex-1">
                    {post.excerpt || post.content.replace(/<[^>]*>/g, '').substring(0, 150) + "..."}
                  </p>
                  <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                    Baca Selengkapnya <ArrowRight className="h-3 w-3 group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
