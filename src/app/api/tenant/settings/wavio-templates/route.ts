import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { parseBody } from "@/lib/api-utils"

const schema = z.object({
  wavioApiKey: z.string(),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = await parseBody(req, schema)
  if (parsed.error) return parsed.error
  const { wavioApiKey } = parsed.data

  try {
    const res = await fetch(`https://api.wavio.web.id/api/v1/public/templates`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": wavioApiKey,
      },
    })
    const result = await res.json()
    if (!res.ok) {
      return NextResponse.json(
        { error: `Wavio API error: ${result.message || res.statusText}` },
        { status: 400 }
      )
    }
    
    // Asumsi: Wavio mengembalikan format { success: true, data: [...] }
    const templates = Array.isArray(result.data) ? result.data : Array.isArray(result) ? result : []
    
    return NextResponse.json({ data: templates })
  } catch (err: any) {
    return NextResponse.json(
      { error: `Koneksi Wavio API gagal: ${err.message}` },
      { status: 400 }
    )
  }
}
