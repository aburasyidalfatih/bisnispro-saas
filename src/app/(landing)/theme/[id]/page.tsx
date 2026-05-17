import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import Handlebars from "handlebars"
import parse from "html-react-parser"

// Dummy data untuk mengisi variabel Handlebars di demo
const DUMMY_TENANT = {
  name: "SMA Prestasi Bangsa",
  tagline: "Membentuk Generasi Cerdas dan Berkarakter",
  about: "SMA Prestasi Bangsa adalah sekolah unggulan yang berdedikasi untuk memberikan pendidikan berkualitas tinggi berbasis karakter dan teknologi. Kami mempersiapkan siswa untuk siap menghadapi tantangan global dengan fasilitas lengkap dan tenaga pengajar profesional.",
  address: "Jl. Pendidikan No. 123, Jakarta",
  phone: "+62 812 3456 7890",
  email: "info@prestasibangsa.sch.id",
  logo: "https://ui-avatars.com/api/?name=PB&background=4f46e5&color=fff",
  facilities: [
    { name: "Laboratorium Komputer", description: "Dilengkapi iMac terbaru", imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=400&auto=format&fit=crop" },
    { name: "Perpustakaan Digital", description: "Akses ribuan e-book gratis", imageUrl: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=400&auto=format&fit=crop" },
    { name: "Lapangan Olahraga", description: "Fasilitas olahraga standar internasional", imageUrl: "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?q=80&w=400&auto=format&fit=crop" }
  ],
  stats: {
    students: "1250+",
    teachers: "85+",
    alumni: "15000+"
  },
  settings: {
    primaryColor: "#4f46e5",
  }
}

export default async function ThemeDemoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Jangan render demo untuk tema sistem (karena mereka berbasis React, bukan Handlebars)
  if (id.startsWith("sys-")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-sm border max-w-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Live Demo Tidak Tersedia</h1>
          <p className="text-gray-600">Tema bawaan sistem (System Themes) tidak dapat di-preview melalui URL ini. Preview hanya berlaku untuk tema kustom yang di-upload (.zip).</p>
        </div>
      </div>
    )
  }

  // Fetch tema dari database
  const theme = await db.customTheme.findUnique({
    where: { id }
  })

  if (!theme) notFound()

  try {
    // Kompilasi template dengan data dummy
    const template = Handlebars.compile(theme.indexHtml)
    const layoutTemplate = Handlebars.compile(theme.layoutHtml)
    
    const themeContext = {
      tenant: DUMMY_TENANT,
      base: `/theme/${id}`, // Base URL dummy
      settings: DUMMY_TENANT.settings,
    }
    
    const pageHtml = template(themeContext)
    const finalHtml = layoutTemplate({ ...themeContext, body: new Handlebars.SafeString(pageHtml) })
    
    return (
      <>
        {/* Inject CSS kustom jika ada */}
        {theme.customCss && (
          <style dangerouslySetInnerHTML={{ __html: theme.customCss }} />
        )}
        
        {/* Render HTML hasil kompilasi Handlebars */}
        {parse(finalHtml)}

        {/* Inject Banner Preview Mode */}
        <div className="fixed bottom-0 left-0 right-0 bg-indigo-600 text-white p-3 flex justify-between items-center z-[9999] shadow-lg">
          <div className="flex items-center gap-4 container mx-auto">
            <span className="font-bold bg-white text-indigo-600 px-2 py-1 rounded text-xs uppercase tracking-wider">Preview Mode</span>
            <p className="text-sm font-medium">Anda sedang melihat demo untuk tema: <span className="font-bold">{theme.name}</span> by {theme.author}</p>
          </div>
        </div>
        
        {/* Inject JS kustom jika ada */}
        {theme.customJs && (
          <script dangerouslySetInnerHTML={{ __html: theme.customJs }} />
        )}
      </>
    )
  } catch (e: any) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6 max-w-2xl w-full">
          <h1 className="text-xl font-bold text-red-600 mb-4">Gagal Me-render Tema</h1>
          <p className="text-gray-700 mb-4">Terdapat kesalahan sintaks Handlebars di dalam tema ini:</p>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-auto whitespace-pre-wrap">
            {e.message}
          </pre>
        </div>
      </div>
    )
  }
}
