import Link from "next/link"
import { FileQuestion, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DashboardNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-8">
      <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-6">
        <FileQuestion className="h-10 w-10 text-primary" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Halaman Tidak Ditemukan</h2>
      <p className="text-muted-foreground mb-6">
        Halaman yang Anda cari tidak ada atau telah dipindahkan.
      </p>
      <Button asChild>
        <Link href="/admin">
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Dashboard
        </Link>
      </Button>
    </div>
  )
}
