import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GraduationCap, Play, Lock, ChevronRight, BookOpen } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default async function AcademyCatalogPage() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id

  // Fetch all published courses
  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    include: {
      author: { select: { name: true } },
      _count: { select: { modules: true, enrollments: true } },
      // Check if current user is enrolled
      ...(userId ? {
        enrollments: {
          where: { userId }
        }
      } : {})
    },
    orderBy: { createdAt: "desc" }
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Katalog Kelas Academy</h1>
          <p className="text-muted-foreground text-sm">Tingkatkan skill dan pengetahuan manajemen sekolah Anda.</p>
        </div>
        <Link href="/admin/academy/my-courses">
          <Button variant="outline" className="gap-2 rounded-xl">
            <BookOpen className="h-4 w-4" />
            Kelas Saya
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {courses.length === 0 ? (
          <div className="col-span-full py-20 text-center glass rounded-3xl">
            <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-bold">Belum Ada Kelas</h3>
            <p className="text-muted-foreground">Super Admin belum menerbitkan kelas apapun.</p>
          </div>
        ) : (
          courses.map(course => {
            const isEnrolled = course.enrollments && course.enrollments.length > 0;
            return (
              <Card key={course.id} className="glass border-0 shadow-xl rounded-2xl overflow-hidden flex flex-col group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="relative h-40 w-full bg-muted overflow-hidden">
                  {course.thumbnail ? (
                    <Image src={course.thumbnail} alt={course.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                      <GraduationCap className="h-16 w-16 text-primary/30" />
                    </div>
                  )}
                  {course.price === 0 && !isEnrolled && (
                    <span className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg shadow-sm">
                      GRATIS
                    </span>
                  )}
                  {isEnrolled && (
                    <span className="absolute top-3 right-3 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg shadow-sm">
                      Terdaftar
                    </span>
                  )}
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
                    <span className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" /> {course._count.enrollments} Peserta</span>
                  </div>
                  <div className="text-sm font-bold text-foreground">
                    {course.price > 0 ? `Rp ${course.price.toLocaleString("id-ID")}` : <span className="text-emerald-600">GRATIS</span>}
                  </div>
                </CardContent>
                
                <CardFooter className="p-4 pt-0">
                  <Link href={`/admin/academy/${course.slug}`} className="w-full">
                    <Button className="w-full rounded-xl gap-2 font-semibold" variant={isEnrolled ? "default" : "outline"}>
                      {isEnrolled ? (
                        <>Lanjut Belajar <Play className="h-3.5 w-3.5 fill-current" /></>
                      ) : (
                        <>Lihat Detail <ChevronRight className="h-4 w-4" /></>
                      )}
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
