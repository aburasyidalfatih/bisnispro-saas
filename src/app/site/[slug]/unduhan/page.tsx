import { PageHeader } from "@/app/site/[slug]/_components/page-header"
import { notFound } from "next/navigation"
import Link from "next/link"
import { getPublicTenantBySlug } from "@/lib/services/tenant-public"
import { getPublicBasePath } from "@/lib/utils/public-path"
import { Download, FileText, ExternalLink, Search } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

export default async function UnduhanPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getPublicTenantBySlug(slug)
  if (!tenant) notFound()

  const documents = tenant.documents || []
  const base = await getPublicBasePath(slug)

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
          <div className="text-center py-20 bg-muted/30 rounded-[40px] border-2 border-dashed">
             <p className="text-muted-foreground">Belum ada dokumen yang tersedia untuk diunduh.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {documents.map((doc: any) => (
              <div 
                key={doc.id} 
                className="group flex items-center justify-between p-6 bg-background rounded-2xl border hover:border-primary/50 hover:shadow-md transition-all duration-300"
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
                    href={doc.url} 
                    target="_blank" 
                    rel="noopener"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
                   >
                      <Download className="h-4 w-4" /> Unduh Dokumen
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
