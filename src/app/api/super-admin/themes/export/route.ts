import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import JSZip from "jszip"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const themeId = searchParams.get("theme")
    
    if (!themeId) {
      return NextResponse.json({ error: "Theme ID is required" }, { status: 400 })
    }

    // Buat ZIP boilerplate untuk freelancer
    const zip = new JSZip()

    // 1. theme.json
    const themeJson = {
      name: themeId === "sys-modern" ? "Tema Corporat" : "Tema Default",
      author: "SchoolPro Official",
      version: "1.0.0",
      description: "Template dasar yang diexport dari sistem."
    }
    zip.file("theme.json", JSON.stringify(themeJson, null, 2))

    // 2. layouts/main.hbs
    const mainHbs = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{tenant.name}}</title>
  <!-- Tailwind via CDN untuk development lokal -->
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 text-gray-900">
  <nav class="bg-indigo-600 text-white p-4">
    <div class="container mx-auto flex justify-between items-center">
      <h1 class="text-2xl font-bold">{{tenant.name}}</h1>
      <p class="text-sm opacity-80">{{tenant.tagline}}</p>
    </div>
  </nav>

  <main>
    {{{body}}}
  </main>

  <footer class="bg-gray-900 text-white p-8 mt-12 text-center">
    <p>&copy; 2024 {{tenant.name}}. All rights reserved.</p>
  </footer>
</body>
</html>`
    zip.file("layouts/main.hbs", mainHbs)

    // 3. templates/index.hbs
    const indexHbs = `<section class="container mx-auto mt-12 px-4">
  <div class="bg-white rounded-xl shadow-md p-8 border border-gray-100 mb-12">
    <h2 class="text-3xl font-bold text-gray-800 mb-4">Selamat Datang di {{tenant.name}}</h2>
    <p class="text-gray-600 text-lg leading-relaxed">{{tenant.about}}</p>
  </div>

  <h3 class="text-2xl font-bold text-gray-800 mb-6">Fasilitas Sekolah</h3>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    {{#each tenant.facilities}}
      <div class="bg-white rounded-lg shadow overflow-hidden group">
        <img src="{{this.imageUrl}}" alt="{{this.name}}" class="w-full h-48 object-cover group-hover:scale-105 transition-transform">
        <div class="p-4">
          <h4 class="font-bold text-lg text-indigo-700">{{this.name}}</h4>
          <p class="text-sm text-gray-500 mt-2">{{this.description}}</p>
        </div>
      </div>
    {{/each}}
  </div>
</section>`
    zip.file("templates/index.hbs", indexHbs)

    // 4. templates/fasilitas.hbs
    const fasilitasHbs = `<div class="container mx-auto mt-12 px-4">
  <h1 class="text-4xl font-bold mb-8 text-indigo-700">Semua Fasilitas</h1>
  <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
    {{#each tenant.facilities}}
       <div class="bg-white rounded-lg shadow p-4 border border-indigo-50">
         <h4 class="font-bold text-lg mb-2">{{this.name}}</h4>
         <span class="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full font-semibold">{{this.category}}</span>
       </div>
    {{/each}}
  </div>
</div>`
    zip.file("templates/fasilitas.hbs", fasilitasHbs)

    // 5. assets/styles.css and scripts.js
    zip.file("assets/styles.css", "/* Custom CSS anda di sini */\n.container { max-width: 1200px; }")
    zip.file("assets/scripts.js", "console.log('Tema di-load dengan sukses!');")

    // Generate blob
    const buffer = await zip.generateAsync({ type: "nodebuffer" })

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="template-${themeId}.zip"`,
      }
    })

  } catch (error: any) {
    console.error("Theme export error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
