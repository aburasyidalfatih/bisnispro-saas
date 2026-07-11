import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { Metadata } from "next"

interface PageProps {
  params: Promise<{ slug: string; pageSlug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, pageSlug } = await params
  const tenant = await db.tenant.findUnique({
    where: { slug },
    include: { customPages: { where: { slug: pageSlug, isPublished: true } } }
  })

  const page = tenant?.customPages[0]
  if (!page) return {}

  return {
    title: page.title,
    description: page.content?.substring(0, 160).replace(/<[^>]*>?/gm, "") || "",
  }
}

export default async function CustomPagePublicView({ params }: PageProps) {
  const { slug, pageSlug } = await params
  
  const tenant = await db.tenant.findUnique({
    where: { slug },
    include: { customPages: { where: { slug: pageSlug, isPublished: true } } }
  })

  if (!tenant || !tenant.customPages || tenant.customPages.length === 0) {
    notFound()
  }

  const page = tenant.customPages[0]

  return (
    <div className="bg-background min-h-screen pt-24 pb-16">
      <div className="container max-w-4xl mx-auto px-4">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-8">{page.title}</h1>
        
        {page.content ? (
          <div 
            className="prose prose-slate md:prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-p:mb-6 prose-p:mt-2 prose-p:leading-relaxed prose-a:text-primary hover:prose-a:text-primary/80"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        ) : (
          <p className="text-muted-foreground italic">Konten halaman belum tersedia.</p>
        )}
      </div>
    </div>
  )
}
