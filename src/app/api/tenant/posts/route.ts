import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { postSchema } from "@/features/post/schemas/post.schema"
import { parseBody, requireTenantMembership } from "@/lib/api-utils"
import { z } from "zod"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  const type = url.searchParams.get("type")

  if (!tenantId) return NextResponse.json({ error: "tenantId harus diisi" }, { status: 400 })

  const { error } = await requireTenantMembership(tenantId)
  if (error) return error

  try {
    const { listPosts } = await import("@/features/post/services/content.service")
    const posts = await listPosts(tenantId, type)
    return NextResponse.json(posts)
  } catch (error: any) {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const schema = z.object({
    tenantId: z.string().min(1),
  }).and(postSchema)

  const parsed = await parseBody(req, schema)
  if (parsed.error) return parsed.error
  const { tenantId, ...data } = parsed.data

  try {
    const { createPost } = await import("@/features/post/services/content.service")
    const post = await createPost({
      tenantId,
      userId: session.user.id,
      isSuperAdmin: session.user.isSuperAdmin,
      data: data as any
    })
    return NextResponse.json({ message: "Artikel berhasil dibuat", post })
  } catch (error: any) {
    const status = error.message?.includes("izin") ? 403 : 500
    return NextResponse.json({ error: error.message || "Terjadi kesalahan" }, { status })
  }
}
