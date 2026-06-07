import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""

    const where = {
      ...(search ? { title: { contains: search, mode: 'insensitive' as any } } : {})
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        include: { author: { select: { name: true } }, _count: { select: { enrollments: true, modules: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.course.count({ where })
    ])

    return NextResponse.json({ data: courses, total })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { title, slug, description, thumbnail, price, isPublished } = body

    if (!title || !slug) {
      return NextResponse.json({ error: "Judul dan Slug wajib diisi" }, { status: 400 })
    }

    const exists = await prisma.course.findUnique({ where: { slug } })
    if (exists) {
      return NextResponse.json({ error: "Slug sudah digunakan" }, { status: 400 })
    }

    const course = await prisma.course.create({
      data: {
        title,
        slug,
        description,
        thumbnail,
        price: parseInt(price) || 0,
        isPublished: !!isPublished,
        authorId: session.user.id
      }
    })

    return NextResponse.json(course)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
