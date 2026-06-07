import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db as prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GraduationCap, Play, ChevronLeft, BookOpen } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default async function MyCoursesPage() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id

  if (!userId) redirect("/login")

  const enrollments = await prisma.courseEnrollment.findMany({
    where: { userId },
    include: {
      course: {
        include: {
          author: { select: { name: true } },
          _count: { select: { modules: true, enrollments: true } }
        }
      }
    },
    orderBy: { enrolledAt: "desc" }
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link href="/admin/academy" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
            <ChevronLeft className="h-4 w-4" />
            Kembali ke Katalog
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Kelas Saya</h1>
          <p className="text-muted-foreground text-sm">Lanjutkan proses belajar Anda.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {enrollments.length === 0 ? (
          <div className="col-span-full py-20 text-center glass rounded-3xl">
            <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-bold">Belum Ada Kelas</h3>
            <p className="text-muted-foreground mb-4">Anda belum mendaftar di kelas apapun.</p>
            <Link href="/admin/academy">
              <Button variant="default" className="rounded-xl">
                Jelajahi Katalog Kelas
              </Button>
            </Link>
          </div>
        ) : (
          enrollments.map(enrollment => {
            const course = enrollment.course;
            if (!course) return null;
            
            return (
              <Card key={enrollment.id} className="glass border-0 shadow-xl rounded-2xl overflow-hidden flex flex-col group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="relative h-40 w-full bg-muted overflow-hidden">
                  {course.thumbnail ? (
                    <Image src={course.thumbnail} alt={course.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                      <GraduationCap className="h-16 w-16 text-primary/30" />
                    </div>
                  )}
                  <span className="absolute top-3 right-3 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg shadow-sm">
                    Terdaftar
                  </span>
                </div>
                
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                    {course.title}
                  </CardTitle>
                  <CardDescription className="text-xs">Oleh {course.author?.name || "Admin"}</CardDescription>
                </CardHeader>
                
                <CardContent className="p-4 pt-0 flex-1 flex flex-col justify-end">
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-medium mb-3">
                    <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {course._count.modules} Modul</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mb-1 overflow-hidden">
                    <div className="bg-primary h-2 rounded-full" style={{ width: `${enrollment.progress || 0}%` }}></div>
                  </div>
                  <p className="text-[10px] text-muted-foreground text-right">{Math.round(enrollment.progress || 0)}% Selesai</p>
                </CardContent>
                
                <CardFooter className="p-4 pt-0">
                  <Link href={`/admin/academy/learn/${course.slug}`} className="w-full">
                    <Button className="w-full rounded-xl gap-2 font-semibold" variant="default">
                      Lanjut Belajar <Play className="h-3.5 w-3.5 fill-current" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
