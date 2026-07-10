import { auth } from "@/lib/auth"
import { db as prisma } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import { AcademyPlayer } from "./player-client"

export default async function LearnCoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) redirect("/login")

  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      modules: {
        orderBy: { sortOrder: "asc" },
        include: {
          lessons: {
            orderBy: { sortOrder: "asc" },
            include: {
              progress: {
                where: { enrollment: { userId } } // Wait, progress doesn't have userId directly
              }
            }
          }
        }
      },
      enrollments: {
        where: { userId }
      }
    }
  })

  if (!course) notFound()
  if (course.enrollments.length === 0) {
    redirect(`/admin/academy/${slug}`)
  }

  return (
    <div className="-m-6 h-[calc(100vh-4rem)] flex flex-col bg-background overflow-hidden">
      <AcademyPlayer course={course} />
    </div>
  )
}
