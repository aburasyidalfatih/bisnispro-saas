import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-mesh p-4">
      <div className="text-center max-w-md">
        <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-2xl bg-primary/10 mb-6">
          <span className="text-4xl">🔍</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">404</h1>
        <p className="text-lg text-muted-foreground mb-6">
          Halaman yang Anda cari tidak ditemukan.
        </p>
        <Link
          href="/admin"
          className="inline-flex items-center justify-center h-11 px-6 rounded-xl btn-gradient text-white font-medium shadow-lg"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  )
}
