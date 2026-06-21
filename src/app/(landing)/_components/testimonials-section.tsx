import { MessageSquareQuote } from "lucide-react"

export function TestimonialsSection({ testimonials }: { testimonials: any[] }) {
  if (!testimonials || testimonials.length === 0) return null

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="text-center mb-12 space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm text-primary font-medium">
          <MessageSquareQuote className="h-4 w-4" />
          Kata Mereka
        </div>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
          Testimoni Mitra Kami
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Apa kata mereka yang telah merasakan langsung kemudahan menggunakan platform kami.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.map((t) => (
          <div key={t.id} className="relative p-6 bg-white rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
            <MessageSquareQuote className="absolute top-6 right-6 h-8 w-8 text-primary/10" />
            <div className="flex items-center gap-4 mb-4">
              {t.tenant?.logo ? (
                <img src={t.tenant.logo} alt="Logo" className="w-12 h-12 rounded-full object-cover border" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {t.tenant?.name?.[0]?.toUpperCase() || t.user?.name?.[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <h4 className="font-semibold text-gray-900">{t.user?.name}</h4>
                <p className="text-sm text-gray-500 capitalize">
                  {t.user?.tenants?.[0]?.role ? t.user.tenants[0].role : "Admin"} • {t.tenant?.name}
                </p>
              </div>
            </div>
            <p className="text-gray-700 leading-relaxed italic line-clamp-4">"{t.message}"</p>
          </div>
        ))}
      </div>
    </section>
  )
}
