import JSZip from "jszip"
import { db } from "@/lib/db"
import {
  STARTER_README,
  LAYOUT_MAIN_HBS,
  TEMPLATE_INDEX_HBS,
  TEMPLATE_PROFIL_HBS,
  TEMPLATE_FASILITAS_HBS,
  TEMPLATE_GURU_HBS,
  TEMPLATE_BERITA_HBS,
  TEMPLATE_BERITA_DETAIL_HBS,
  TEMPLATE_GALERI_HBS,
  TEMPLATE_KONTAK_HBS,
  TEMPLATE_EKSKUL_HBS,
  TEMPLATE_PROGRAM_HBS,
  TEMPLATE_PRESTASI_HBS,
  TEMPLATE_PENGUMUMAN_HBS,
  TEMPLATE_PENGUMUMAN_DETAIL_HBS,
  TEMPLATE_PPDB_HBS,
  TEMPLATE_ALUMNI_HBS,
  TEMPLATE_AGENDA_HBS,
  TEMPLATE_UNDUHAN_HBS,
  TEMPLATE_GURU_DETAIL_HBS,
  STARTER_CSS,
  STARTER_JS
} from "../constants/starter-templates"

function safeZipName(value: string | null | undefined, fallback: string) {
  const normalized = (value || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)

  return normalized || fallback
}

export async function exportTheme(themeId: string): Promise<{ buffer: Buffer; filename: string }> {
  const zip = new JSZip()

  // If custom theme, export from DB
  if (!themeId.startsWith("sys-")) {
    const theme = await db.customTheme.findUnique({ where: { id: themeId } })
    if (!theme) throw new Error("Tema tidak ditemukan")

    zip.file("theme.json", JSON.stringify({
      name: theme.name,
      author: theme.author,
      version: theme.version,
      description: `Tema kustom ${theme.name} diekspor dari SchoolPro.`
    }, null, 2))

    zip.file("layouts/main.hbs", theme.layoutHtml)
    zip.file("templates/index.hbs", theme.indexHtml)
    if (theme.facilityHtml) zip.file("templates/fasilitas.hbs", theme.facilityHtml)
    if (theme.aboutHtml) zip.file("templates/profil.hbs", theme.aboutHtml)
    if (theme.staffHtml) zip.file("templates/guru.hbs", theme.staffHtml)
    if (theme.newsHtml) zip.file("templates/berita.hbs", theme.newsHtml)
    if (theme.newsDetailHtml) zip.file("templates/berita-detail.hbs", theme.newsDetailHtml)
    if (theme.galleryHtml) zip.file("templates/galeri.hbs", theme.galleryHtml)
    if (theme.contactHtml) zip.file("templates/kontak.hbs", theme.contactHtml)
    if (theme.extracurricularHtml) zip.file("templates/ekstrakurikuler.hbs", theme.extracurricularHtml)
    if (theme.programHtml) zip.file("templates/program.hbs", theme.programHtml)
    if (theme.achievementHtml) zip.file("templates/prestasi.hbs", theme.achievementHtml)
    if (theme.pengumumanHtml) zip.file("templates/pengumuman.hbs", theme.pengumumanHtml)
    if (theme.pengumumanDetailHtml) zip.file("templates/pengumuman-detail.hbs", theme.pengumumanDetailHtml)
    if (theme.ppdbHtml) zip.file("templates/ppdb.hbs", theme.ppdbHtml)
    if (theme.alumniHtml) zip.file("templates/alumni.hbs", theme.alumniHtml)
    if (theme.agendaHtml) zip.file("templates/agenda.hbs", theme.agendaHtml)
    if (theme.unduhanHtml) zip.file("templates/unduhan.hbs", theme.unduhanHtml)
    if (theme.staffDetailHtml) zip.file("templates/guru-detail.hbs", theme.staffDetailHtml)
    if (theme.customCss) zip.file("assets/styles.css", theme.customCss)
    if (theme.customJs) zip.file("assets/scripts.js", theme.customJs)
    
    zip.file("README.md", STARTER_README)

    const buffer = await zip.generateAsync({ type: "nodebuffer" })
    return {
      buffer,
      filename: `${safeZipName(theme.name, "custom-theme")}-v${safeZipName(theme.version, "1.0.0")}.zip`
    }
  }

  if (themeId !== "sys-default" && themeId !== "sys-modern") {
    throw new Error("Tema tidak ditemukan")
  }

  // ========================================
  // SYSTEM THEME: Generate full starter kit
  // ========================================
  const themeName = themeId === "sys-modern" ? "Tema Corporat" : "Tema Default"

  // 1. theme.json
  zip.file("theme.json", JSON.stringify({
    name: themeName,
    author: "SchoolPro Official",
    version: "1.0.0",
    description: "Template starter kit lengkap dari SchoolPro. Berisi semua halaman yang tersedia untuk dikustomisasi oleh tim desain."
  }, null, 2))

  // 2. README.md — Dokumentasi variabel Handlebars
  zip.file("README.md", STARTER_README)

  // 3. layouts/main.hbs — Layout utama
  zip.file("layouts/main.hbs", LAYOUT_MAIN_HBS)

  // 4. Semua template halaman
  zip.file("templates/index.hbs", TEMPLATE_INDEX_HBS)
  zip.file("templates/profil.hbs", TEMPLATE_PROFIL_HBS)
  zip.file("templates/fasilitas.hbs", TEMPLATE_FASILITAS_HBS)
  zip.file("templates/guru.hbs", TEMPLATE_GURU_HBS)
  zip.file("templates/berita.hbs", TEMPLATE_BERITA_HBS)
  zip.file("templates/berita-detail.hbs", TEMPLATE_BERITA_DETAIL_HBS)
  zip.file("templates/galeri.hbs", TEMPLATE_GALERI_HBS)
  zip.file("templates/kontak.hbs", TEMPLATE_KONTAK_HBS)
  zip.file("templates/ekstrakurikuler.hbs", TEMPLATE_EKSKUL_HBS)
  zip.file("templates/program.hbs", TEMPLATE_PROGRAM_HBS)
  zip.file("templates/prestasi.hbs", TEMPLATE_PRESTASI_HBS)
  zip.file("templates/pengumuman.hbs", TEMPLATE_PENGUMUMAN_HBS)
  zip.file("templates/pengumuman-detail.hbs", TEMPLATE_PENGUMUMAN_DETAIL_HBS)
  zip.file("templates/ppdb.hbs", TEMPLATE_PPDB_HBS)
  zip.file("templates/alumni.hbs", TEMPLATE_ALUMNI_HBS)
  zip.file("templates/agenda.hbs", TEMPLATE_AGENDA_HBS)
  zip.file("templates/unduhan.hbs", TEMPLATE_UNDUHAN_HBS)
  zip.file("templates/guru-detail.hbs", TEMPLATE_GURU_DETAIL_HBS)

  // 5. Assets
  zip.file("assets/styles.css", STARTER_CSS)
  zip.file("assets/scripts.js", STARTER_JS)

  const buffer = await zip.generateAsync({ type: "nodebuffer" })

  return {
    buffer,
    filename: `template-${themeId}.zip`
  }
}
