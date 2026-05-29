import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import JSZip from "jszip"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 })
    }

    if (!file.name.endsWith('.zip')) {
      return NextResponse.json({ error: "File harus berformat .zip" }, { status: 400 })
    }

    // Enforce max 10MB file size
    const MAX_SIZE = 10 * 1024 * 1024 // 10MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: `File terlalu besar (${(file.size / 1024 / 1024).toFixed(1)}MB). Maksimal 10MB.` }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const zip = await JSZip.loadAsync(arrayBuffer)
    
    // Check for theme.json
    const themeJsonFile = Object.values(zip.files).find(f => f.name.endsWith('theme.json') && !f.name.includes('__MACOSX'))
    if (!themeJsonFile) {
      return NextResponse.json({ error: "theme.json tidak ditemukan di dalam zip" }, { status: 400 })
    }

    const themeJsonStr = await themeJsonFile.async("string")
    let themeMeta
    try {
      themeMeta = JSON.parse(themeJsonStr)
    } catch (e) {
      return NextResponse.json({ error: "theme.json format tidak valid" }, { status: 400 })
    }

    if (!themeMeta.name) {
      return NextResponse.json({ error: "theme.json harus memiliki property 'name'" }, { status: 400 })
    }

    // Extract HTML templates
    const getFileContent = async (filename: string) => {
      const f = Object.values(zip.files).find(file => file.name.endsWith(filename) && !file.name.includes('__MACOSX'))
      return f ? await f.async("string") : ""
    }

    const layoutHtml = await getFileContent("main.hbs") || await getFileContent("theme.hbs")
    const indexHtml = await getFileContent("index.hbs")
    const facilityHtml = await getFileContent("fasilitas.hbs")
    const aboutHtml = await getFileContent("profil.hbs")
    const staffHtml = await getFileContent("guru.hbs")
    const newsHtml = await getFileContent("berita.hbs")
    const newsDetailHtml = await getFileContent("berita-detail.hbs")
    const galleryHtml = await getFileContent("galeri.hbs")
    const contactHtml = await getFileContent("kontak.hbs")
    const extracurricularHtml = await getFileContent("ekstrakurikuler.hbs")
    const programHtml = await getFileContent("program.hbs")
    const achievementHtml = await getFileContent("prestasi.hbs")
    const pengumumanHtml = await getFileContent("pengumuman.hbs")
    const pengumumanDetailHtml = await getFileContent("pengumuman-detail.hbs")
    const ppdbHtml = await getFileContent("ppdb.hbs")
    const alumniHtml = await getFileContent("alumni.hbs")
    const agendaHtml = await getFileContent("agenda.hbs")
    const unduhanHtml = await getFileContent("unduhan.hbs")
    const staffDetailHtml = await getFileContent("guru-detail.hbs")
    const customCss = await getFileContent("styles.css")
    const customJs = await getFileContent("scripts.js")
    
    if (!layoutHtml || !indexHtml) {
      return NextResponse.json({ error: "Tema harus memiliki minimal file layouts/main.hbs dan templates/index.hbs" }, { status: 400 })
    }

    // Validate Handlebars syntax before saving (Linter)
    try {
      const Handlebars = (await import("handlebars")).default
      const templateFiles: Record<string, string> = {
        "main.hbs": layoutHtml,
        "index.hbs": indexHtml,
        ...(facilityHtml ? { "fasilitas.hbs": facilityHtml } : {}),
        ...(aboutHtml ? { "profil.hbs": aboutHtml } : {}),
        ...(staffHtml ? { "guru.hbs": staffHtml } : {}),
        ...(newsHtml ? { "berita.hbs": newsHtml } : {}),
        ...(newsDetailHtml ? { "berita-detail.hbs": newsDetailHtml } : {}),
        ...(galleryHtml ? { "galeri.hbs": galleryHtml } : {}),
        ...(contactHtml ? { "kontak.hbs": contactHtml } : {}),
        ...(extracurricularHtml ? { "ekstrakurikuler.hbs": extracurricularHtml } : {}),
        ...(programHtml ? { "program.hbs": programHtml } : {}),
        ...(achievementHtml ? { "prestasi.hbs": achievementHtml } : {}),
        ...(pengumumanHtml ? { "pengumuman.hbs": pengumumanHtml } : {}),
        ...(pengumumanDetailHtml ? { "pengumuman-detail.hbs": pengumumanDetailHtml } : {}),
        ...(ppdbHtml ? { "ppdb.hbs": ppdbHtml } : {}),
        ...(alumniHtml ? { "alumni.hbs": alumniHtml } : {}),
        ...(agendaHtml ? { "agenda.hbs": agendaHtml } : {}),
        ...(unduhanHtml ? { "unduhan.hbs": unduhanHtml } : {}),
        ...(staffDetailHtml ? { "guru-detail.hbs": staffDetailHtml } : {}),
      }
      
      const syntaxErrors: string[] = []
      for (const [filename, content] of Object.entries(templateFiles)) {
        try {
          Handlebars.precompile(content)
        } catch (e: any) {
          syntaxErrors.push(`${filename}: ${e.message}`)
        }
      }
      
      if (syntaxErrors.length > 0) {
        return NextResponse.json({ 
          error: "Template Handlebars mengandung syntax error", 
          details: syntaxErrors 
        }, { status: 400 })
      }
    } catch (e) {
      console.error("[THEME_UPLOAD] Handlebars validation error:", e)
      // Non-fatal: continue if Handlebars module fails to load
    }

    // Save or Update DB
    const existingTheme = await db.customTheme.findFirst({
      where: { name: themeMeta.name }
    })

    const themeData = {
      name: themeMeta.name,
      author: themeMeta.author || "Unknown",
      version: themeMeta.version || "1.0.0",
      thumbnail: themeMeta.thumbnail || null,
      layoutHtml,
      indexHtml,
      facilityHtml: facilityHtml || null,
      aboutHtml: aboutHtml || null,
      staffHtml: staffHtml || null,
      newsHtml: newsHtml || null,
      newsDetailHtml: newsDetailHtml || null,
      galleryHtml: galleryHtml || null,
      contactHtml: contactHtml || null,
      extracurricularHtml: extracurricularHtml || null,
      programHtml: programHtml || null,
      achievementHtml: achievementHtml || null,
      pengumumanHtml: pengumumanHtml || null,
      pengumumanDetailHtml: pengumumanDetailHtml || null,
      ppdbHtml: ppdbHtml || null,
      alumniHtml: alumniHtml || null,
      agendaHtml: agendaHtml || null,
      unduhanHtml: unduhanHtml || null,
      staffDetailHtml: staffDetailHtml || null,
      customCss,
      customJs
    }

    let savedTheme;
    if (existingTheme) {
      savedTheme = await db.customTheme.update({
        where: { id: existingTheme.id },
        data: themeData
      })
    } else {
      savedTheme = await db.customTheme.create({
        data: themeData
      })
    }

    return NextResponse.json({ success: true, theme: savedTheme })
  } catch (error: any) {
    console.error("Theme upload error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
