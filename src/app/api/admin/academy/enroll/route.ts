import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    const formData = await req.formData()
    const courseId = formData.get("courseId") as string

    if (!courseId) {
      return NextResponse.json({ error: "Missing courseId" }, { status: 400 })
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course || !course.isPublished) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    if (course.price > 0) {
      return NextResponse.json({ error: "This course requires payment" }, { status: 400 })
    }

    const userId = session.user.id
    
    // Check if already enrolled
    const existing = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      }
    })

    if (existing) {
      return NextResponse.redirect(new URL(`/admin/academy/learn/${course.slug}`, req.url))
    }

    // Determine tenant from session if possible
    const tenantSlug = session.user.tenants?.[0]?.slug
    let tenantId = null
    if (tenantSlug) {
      const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug }, select: { id: true } })
      if (tenant) tenantId = tenant.id
    }

    await prisma.courseEnrollment.create({
      data: {
        userId,
        courseId,
        tenantId,
        status: "ACTIVE"
      }
    })

    // Redirect to learning room
    return NextResponse.redirect(new URL(`/admin/academy/learn/${course.slug}`, req.url), 303)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
