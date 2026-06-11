import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import JSZip from "jszip"
import { z } from "zod"

const MAX_ZIP_SIZE = 10 * 1024 * 1024
const MAX_UNCOMPRESSED_SIZE = 5 * 1024 * 1024
const MAX_ZIP_ENTRIES = 80
const MAX_TEMPLATE_CHARS = 750_000
const MAX_ASSET_CHARS = 1_000_000

const themeMetaSchema = z.object({
  name: z.string().trim().min(1, "theme.json harus memiliki property 'name'").max(120),
  author: z.string().trim().max(120).optional(),
  version: z.string().trim().max(32).optional(),
  thumbnail: z.preprocess(
    (value) => value === "" ? null : value,
    z.string().trim().url().max(2048).optional().nullable()
  ),
}).passthrough()

class ThemeUploadValidationError extends Error {
  details?: string[]

  constructor(message: string, details?: string[]) {
    super(message)
    this.name = "ThemeUploadValidationError"
    this.details = details
  }
}

function normalizeZipPath(path: string) {
  return path.replace(/\\/g, "/").replace(/^\/+/, "")
}

function isIgnoredZipEntry(path: string) {
  return path.includes("__MACOSX") || path.endsWith(".DS_Store")
}

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

    if (!file.name.toLowerCase().endsWith('.zip')) {
      return NextResponse.json({ error: "File harus berformat .zip" }, { status: 400 })
    }

    if (file.size > MAX_ZIP_SIZE) {
      return NextResponse.json({ error: `File terlalu besar (${(file.size / 1024 / 1024).toFixed(1)}MB). Maksimal 10MB.` }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const zip = await JSZip.loadAsync(arrayBuffer)

    const entries = Object.values(zip.files)
      .filter((entry) => !entry.dir)
      .map((entry) => ({ entry, path: normalizeZipPath(entry.name) }))
      .filter(({ path }) => !isIgnoredZipEntry(path))

    if (entries.length > MAX_ZIP_ENTRIES) {
      return NextResponse.json({ error: `File ZIP berisi terlalu banyak file. Maksimal ${MAX_ZIP_ENTRIES} file.` }, { status: 400 })
    }

    const unsafePath = entries.find(({ path }) => path.split("/").some((part) => part === ".."))
    if (unsafePath) {
      return NextResponse.json({ error: `Path file tidak aman di dalam ZIP: ${unsafePath.path}` }, { status: 400 })
    }

    const declaredUncompressedSize = entries.reduce((total, { entry }) => {
      const size = (entry as any)?._data?.uncompressedSize
      return total + (typeof size === "number" ? size : 0)
    }, 0)
    if (declaredUncompressedSize > MAX_UNCOMPRESSED_SIZE) {
      return NextResponse.json({ error: "Total ukuran file setelah diekstrak terlalu besar. Maksimal 5MB." }, { status: 400 })
    }

    const fileByPath = new Map(entries.map(({ entry, path }) => [path, entry]))

    const readFileContent = async (label: string, paths: string[], maxChars: number) => {
      const entry = paths.map((path) => fileByPath.get(path)).find(Boolean)
      if (!entry) return ""

      const content = await entry.async("string")
      if (content.length > maxChars) {
        throw new ThemeUploadValidationError(`${label} terlalu besar. Maksimal ${Math.round(maxChars / 1024)}KB.`)
      }
      return content
    }

    const themeJsonFile = fileByPath.get("theme.json")
    if (!themeJsonFile) {
      return NextResponse.json({ error: "theme.json tidak ditemukan di dalam zip" }, { status: 400 })
    }

    const themeJsonStr = await themeJsonFile.async("string")
    let rawThemeMeta
    try {
      rawThemeMeta = JSON.parse(themeJsonStr)
    } catch (e) {
      return NextResponse.json({ error: "theme.json format tidak valid" }, { status: 400 })
    }

    const parsedThemeMeta = themeMetaSchema.safeParse(rawThemeMeta)
    if (!parsedThemeMeta.success) {
      return NextResponse.json({
        error: "theme.json format tidak valid",
        details: parsedThemeMeta.error.issues.map((issue) => issue.message),
      }, { status: 400 })
    }
    const themeMeta = parsedThemeMeta.data

    // Extract HTML templates
    const layoutHtml = await readFileContent("layouts/main.hbs", ["layouts/main.hbs", "main.hbs", "theme.hbs"], MAX_TEMPLATE_CHARS)
    const indexHtml = await readFileContent("templates/index.hbs", ["templates/index.hbs", "index.hbs"], MAX_TEMPLATE_CHARS)
    const facilityHtml = await readFileContent("templates/fasilitas.hbs", ["templates/fasilitas.hbs", "fasilitas.hbs"], MAX_TEMPLATE_CHARS)
    const aboutHtml = await readFileContent("templates/profil.hbs", ["templates/profil.hbs", "profil.hbs"], MAX_TEMPLATE_CHARS)
    const staffHtml = await readFileContent("templates/guru.hbs", ["templates/guru.hbs", "guru.hbs"], MAX_TEMPLATE_CHARS)
    const newsHtml = await readFileContent("templates/berita.hbs", ["templates/berita.hbs", "berita.hbs"], MAX_TEMPLATE_CHARS)
    const newsDetailHtml = await readFileContent("templates/berita-detail.hbs", ["templates/berita-detail.hbs", "berita-detail.hbs"], MAX_TEMPLATE_CHARS)
    const galleryHtml = await readFileContent("templates/galeri.hbs", ["templates/galeri.hbs", "galeri.hbs"], MAX_TEMPLATE_CHARS)
    const contactHtml = await readFileContent("templates/kontak.hbs", ["templates/kontak.hbs", "kontak.hbs"], MAX_TEMPLATE_CHARS)
    const extracurricularHtml = await readFileContent("templates/ekstrakurikuler.hbs", ["templates/ekstrakurikuler.hbs", "ekstrakurikuler.hbs"], MAX_TEMPLATE_CHARS)
    const programHtml = await readFileContent("templates/program.hbs", ["templates/program.hbs", "program.hbs"], MAX_TEMPLATE_CHARS)
    const achievementHtml = await readFileContent("templates/prestasi.hbs", ["templates/prestasi.hbs", "prestasi.hbs"], MAX_TEMPLATE_CHARS)
    const pengumumanHtml = await readFileContent("templates/pengumuman.hbs", ["templates/pengumuman.hbs", "pengumuman.hbs"], MAX_TEMPLATE_CHARS)
    const pengumumanDetailHtml = await readFileContent("templates/pengumuman-detail.hbs", ["templates/pengumuman-detail.hbs", "pengumuman-detail.hbs"], MAX_TEMPLATE_CHARS)
    const ppdbHtml = await readFileContent("templates/ppdb.hbs", ["templates/ppdb.hbs", "ppdb.hbs"], MAX_TEMPLATE_CHARS)
    const alumniHtml = await readFileContent("templates/alumni.hbs", ["templates/alumni.hbs", "alumni.hbs"], MAX_TEMPLATE_CHARS)
    const agendaHtml = await readFileContent("templates/agenda.hbs", ["templates/agenda.hbs", "agenda.hbs"], MAX_TEMPLATE_CHARS)
    const unduhanHtml = await readFileContent("templates/unduhan.hbs", ["templates/unduhan.hbs", "unduhan.hbs"], MAX_TEMPLATE_CHARS)
    const staffDetailHtml = await readFileContent("templates/guru-detail.hbs", ["templates/guru-detail.hbs", "guru-detail.hbs"], MAX_TEMPLATE_CHARS)
    const customCss = await readFileContent("assets/styles.css", ["assets/styles.css", "styles.css"], MAX_ASSET_CHARS)
    const customJs = await readFileContent("assets/scripts.js", ["assets/scripts.js", "scripts.js"], MAX_ASSET_CHARS)
    
    if (!layoutHtml || !indexHtml) {
      return NextResponse.json({ error: "Tema harus memiliki minimal file layouts/main.hbs dan templates/index.hbs" }, { status: 400 })
    }

    // Validate Handlebars syntax before saving (Linter)
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

    return NextResponse.json({
      success: true,
      theme: {
        id: savedTheme.id,
        name: savedTheme.name,
        author: savedTheme.author,
        version: savedTheme.version,
        thumbnail: savedTheme.thumbnail,
        isActive: savedTheme.isActive,
      }
    })
  } catch (error: any) {
    if (error instanceof ThemeUploadValidationError) {
      return NextResponse.json({ error: error.message, details: error.details }, { status: 400 })
    }

    console.error("Theme upload error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
