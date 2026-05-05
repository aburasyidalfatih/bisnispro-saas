import { PageHeader } from "@/app/site/[slug]/_components/page-header"
import { notFound } from "next/navigation"
import { getPublicTenantBySlug } from "@/lib/services/tenant-public"
import { getPublicBasePath } from "@/lib/utils/public-path"
import Link from "next/link"
import { Calendar, User, ArrowLeft, Clock, Tag } from "lucide-react"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const tenant = await getPublicTenantBySlug(slug)
  if (!tenant) return {}
  const post = (tenant.posts || []).find((p: any) => p.id === id)
  if (!post) return {}
  return {
    title: `${post.title} - ${tenant.name}`,
    description: post.excerpt || post.content?.replace(/<[^>]*>/g, "").substring(0, 160),
  }
}

export default async function BeritaDetailPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const tenant = await getPublicTenantBySlug(slug)
  if (!tenant) notFound()

  const post = (tenant.posts || []).find((p: any) => p.id === id)
  if (!post) notFound()

  const base = await getPublicBasePath(slug)

  // Get related posts (same type, exclude current)
  const relatedPosts = (tenant.posts || [])
    .filter((p: any) => p.id !== id)
    .slice(0, 3)

  return (
    <div className="bg-background min-h-screen pb-12">
      {/* ── PREMIUM EDITORIAL HERO ── */}
      <div className="relative w-full h-[50vh] md:h-[60vh] lg:h-[70vh] bg-slate-900 overflow-hidden">
        {/* Background Image */}
        {(post.featuredImage || post.image) ? (
          <img
            src={post.featuredImage || post.image}
            alt={post.title}
            className="w-full h-full object-cover opacity-60"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/80 to-slate-900 opacity-60" />
        )}
        
        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        
        {/* Navigation & Breadcrumb (Absolute Top) */}
        <div className="absolute top-0 left-0 right-0 p-6 z-20">
           <div className="max-w-4xl mx-auto flex items-center justify-between">
              <Link 
                href={`${base}/berita`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-bold uppercase tracking-widest transition-all"
              >
                 <ArrowLeft className="h-4 w-4" /> Kembali
              </Link>
           </div>
        </div>

        {/* Title Block (Bottom Aligned) */}
        <div className="absolute bottom-0 left-0 right-0 p-6 z-10 pb-12">
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="px-3 py-1 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                 {post.type || "BERITA"}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-white/80 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                 <Calendar className="h-3.5 w-3.5" />
                 {format(new Date(post.createdAt), "dd MMMM yyyy", { locale: idLocale })}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-white/80 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                 <User className="h-3.5 w-3.5" />
                 Admin
              </div>
            </div>
            
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] mb-6 drop-shadow-lg">
              {post.title}
            </h1>
          </div>
        </div>
      </div>

      <article className="mx-auto max-w-3xl px-4 sm:px-6 py-12 lg:py-16">
        {/* Content */}
        <div
          className="prose prose-lg md:prose-xl max-w-none prose-headings:font-bold prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-relaxed prose-a:text-primary prose-img:rounded-3xl prose-img:shadow-xl"
          dangerouslySetInnerHTML={{ __html: post.content || "" }}
        />

        {/* If content is plain text (no HTML), render as paragraphs */}
        {post.content && !post.content.includes("<") && (
          <div className="text-muted-foreground leading-relaxed text-base whitespace-pre-wrap">
            {post.content}
          </div>
        )}

        {/* Back Link */}
        <div className="mt-12 pt-8 border-t">
          <Link
            href={`${base}/berita`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar Berita
          </Link>
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
          <h3 className="text-xl font-bold mb-6">Berita Lainnya</h3>
          <div className="grid gap-6 md:grid-cols-3">
            {relatedPosts.map((related: any) => (
              <Link
                key={related.id}
                href={`${base}/berita/${related.id}`}
                className="group flex flex-col bg-background rounded-2xl overflow-hidden border hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="aspect-[16/10] relative overflow-hidden bg-muted">
                  {(related.featuredImage || related.image) ? (
                    <img
                      src={related.featuredImage || related.image}
                      alt={related.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-primary/5">
                      <Calendar className="h-8 w-8 text-primary/20" />
                    </div>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-2">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(related.createdAt), "dd MMM yyyy", { locale: idLocale })}
                  </div>
                  <h4 className="text-base font-bold mb-2 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                    {related.title}
                  </h4>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
