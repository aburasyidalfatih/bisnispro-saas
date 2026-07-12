import { Metadata } from "next"
import { getSchoolsDirectory } from "./actions"
import { DirectoryClient } from "./_components/directory-client"

export const metadata: Metadata = {
  title: "Direktori Sekolah - SchoolPro",
  description: "Daftar sekolah yang telah bergabung dan menggunakan layanan digital manajemen sekolah dari SchoolPro.",
}

export default async function DirectoryPage() {
  const initialData = await getSchoolsDirectory({ page: 1 })

  return (
    <div className="min-h-screen bg-muted/30 pt-32 pb-20 px-4">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Direktori Sekolah</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Temukan dan jelajahi ratusan sekolah terbaik di seluruh Indonesia yang telah bertransformasi ke era digital bersama SchoolPro.
          </p>
        </div>
        
        <DirectoryClient initialData={initialData} />
      </div>
    </div>
  )
}
