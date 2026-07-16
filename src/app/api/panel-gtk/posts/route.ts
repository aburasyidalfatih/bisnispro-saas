import { requireTenantMembership } from "@/lib/api-utils"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  if (!tenantId) return NextResponse.json({ error: "tenantId harus diisi" }, { status: 400 })
  const { error: accessError } = await requireTenantMembership(tenantId as string);
  if (accessError) return accessError;

  const posts = await db.post.findMany({
    where: { tenantId, authorId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      category: {
        select: { id: true, name: true }
      }
    }
  })

  return NextResponse.json(posts)
}
