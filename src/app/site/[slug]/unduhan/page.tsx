import { PageHeader } from "@/app/site/[slug]/_components/page-header"
import { notFound } from "next/navigation"
import Link from "next/link"
import { getTenantLayoutData } from "@/features/tenant/services/tenant-modular.service"
import { db } from "@/lib/db"
import { getPublicBasePath } from "@/lib/utils/public-path"
import { Download, FileText, ExternalLink, Search } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

export default async function UnduhanPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getTenantLayoutData(slug)
  if (!tenant) notFound()

  const documents = await db.document.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" }
  })
  const base = await getPublicBasePath(slug)

  // Custom Theme rendering
  if (tenant.customThemeId && tenant.customTheme?.unduhanHtml) {
    const { renderCustomTheme } = await import("@/app/site/[slug]/_themes/custom-renderer")
    const rendered = renderCustomTheme({
      templateHtml: tenant.customTheme.unduhanHtml,
      layoutHtml: tenant.customTheme.layoutHtml,
      customCss: tenant.customTheme.customCss,
      customJs: tenant.customTheme.customJs,
      context: { tenant: { ...tenant, documents }, base, settings: tenant.settings || {} },
    })
    if (rendered) return rendered
  }

  const getFileIcon = (type: string) => {
     return <FileText className="h-6 w-6 text-primary" />
  }

  return (
    <div className="bg-background min-h-screen pb-12">
      {/* ── HERO SECTION ── */}
      <PageHeader
        title="Pusat Unduhan"
        description={<>Akses dokumen, formulir, dan materi digital penting dari {tenant.name}.</>}
        breadcrumbs={[
          { label: "Informasi" },
          { label: "Informasi Publik" }
        ]}
      />

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white/50 rounded-[3rem] border border-dashed border-border/60">
             <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
               <FileText className="h-10 w-10" />
             </div>
             <h3 className="text-2xl font-bold mb-2">Belum ada dokumen</h3>
             <p className="text-muted-foreground max-w-sm text-center">Dokumen, formulir, atau materi digital akan segera diunggah oleh sekolah.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 max-w-5xl mx-auto">
            {documents.map((doc: any) => (
              <div 
                key={doc.id} 
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-white rounded-[2rem] border border-border/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 gap-6"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                     {getFileIcon(doc.type)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{doc.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {doc.type} • Diunggah pada {format(new Date(doc.createdAt), 'dd MMM yyyy', { locale: id })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                   <a 
                    href={doc.fileUrl} 
                    target="_blank" 
                    rel="noopener"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all w-full sm:w-auto"
                   >
                      Unduh <Download className="h-4 w-4 group-hover:animate-bounce" />
                   </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Info tambahan */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
         <div className="bg-primary/5 rounded-3xl p-8 border border-primary/10 flex flex-col md:flex-row items-center gap-6">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
               <Search className="h-6 w-6" />
            </div>
            <div className="flex-1 text-center md:text-left">
               <h4 className="font-bold text-lg">Tidak menemukan dokumen yang dicari?</h4>
               <p className="text-sm text-muted-foreground">Silakan hubungi bagian tata usaha sekolah untuk bantuan informasi lebih lanjut.</p>
            </div>
            <Link href={`${base}/contact`} className="px-6 py-2.5 bg-white border border-primary/20 text-primary rounded-xl text-sm font-bold hover:bg-primary/5 transition-colors">
               Hubungi Kami
            </Link>
         </div>
      </section>
    </div>
  )
}
