import { auth } from "@/lib/auth"
import { db as prisma } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GraduationCap, Play, Lock, ChevronLeft, BookOpen, Clock, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) redirect("/login")

  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      author: { select: { name: true } },
      modules: {
        orderBy: { sortOrder: "asc" },
        include: {
          lessons: {
            orderBy: { sortOrder: "asc" },
            select: { id: true, title: true, duration: true, isPreview: true } // Don't send content here
          }
        }
      },
      enrollments: {
        where: { userId }
      }
    }
  })

  if (!course || !course.isPublished) {
    notFound()
  }

  const isEnrolled = course.enrollments && course.enrollments.length > 0
  const totalLessons = course.modules.reduce((acc, mod) => acc + mod.lessons.length, 0)
  const totalDuration = course.modules.reduce((acc, mod) => 
    acc + mod.lessons.reduce((lAcc, lesson) => lAcc + lesson.duration, 0), 0)

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <Link href="/admin/academy" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="h-4 w-4" />
        Kembali ke Katalog
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">{course.title}</h1>
            <p className="text-muted-foreground">Oleh {course.author?.name || "Admin BisnisPro"}</p>
          </div>

          <Card className="glass border-0 shadow-xl overflow-hidden rounded-2xl">
            <div className="relative w-full aspect-video bg-muted flex items-center justify-center">
              {course.thumbnail ? (
                <Image src={course.thumbnail} alt={course.title} fill className="object-cover" />
              ) : (
                <GraduationCap className="h-20 w-20 text-muted-foreground/30" />
              )}
            </div>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">Tentang Divisi Ini</h2>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {course.description ? (
                  <p className="whitespace-pre-line leading-relaxed">{course.description}</p>
                ) : (
                  <p className="text-muted-foreground italic">Belum ada deskripsi.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-bold mt-8 mb-4">Materi Divisi (Silabus)</h2>
          <div className="space-y-4">
            {course.modules.length === 0 ? (
              <div className="p-8 text-center bg-muted/30 rounded-2xl border border-dashed">
                <p className="text-muted-foreground">Materi belum tersedia untuk divisi ini.</p>
              </div>
            ) : (
              course.modules.map((mod, index) => (
                <Card key={mod.id} className="glass shadow-sm rounded-2xl border-0 overflow-hidden">
                  <CardHeader className="bg-muted/30 py-4 px-5 border-b">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs shrink-0">
                        {index + 1}
                      </div>
                      {mod.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border/40">
                      {mod.lessons.map((lesson, lIdx) => (
                        <div key={lesson.id} className="flex items-center justify-between p-4 hover:bg-muted/10 transition-colors">
                          <div className="flex items-center gap-3">
                            {isEnrolled || lesson.isPreview ? (
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                <Play className="h-3 w-3 ml-0.5 fill-current" />
                              </div>
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                                <Lock className="h-3.5 w-3.5" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-sm">{lIdx + 1}. {lesson.title}</p>
                              {lesson.isPreview && !isEnrolled && (
                                <span className="text-[9px] uppercase tracking-widest font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                  Preview Gratis
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                            <Clock className="h-3 w-3" />
                            {lesson.duration} mnt
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Sticky Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <Card className="glass border-0 shadow-2xl rounded-2xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-blue-500" />
              <CardContent className="p-6">
                <div className="text-3xl font-black mb-6">
                  {course.price > 0 ? `Rp ${course.price.toLocaleString("id-ID")}` : <span className="text-emerald-600">GRATIS</span>}
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3 text-sm">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span>{course.modules.length} Modul</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Play className="h-4 w-4 text-primary" />
                    <span>{totalLessons} Materi Video/Teks</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>Total {totalDuration} Menit</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>Akses Selamanya</span>
                  </div>
                </div>

                {isEnrolled ? (
                  <Link href={`/admin/academy/learn/${course.slug}`}>
                    <Button className="w-full rounded-xl h-12 text-base font-bold shadow-lg shadow-primary/20">
                      Lanjutkan Belajar <Play className="h-4 w-4 ml-2 fill-current" />
                    </Button>
                  </Link>
                ) : course.price === 0 ? (
                  <form action="/api/admin/academy/enroll" method="POST">
                    <input type="hidden" name="courseId" value={course.id} />
                    <Button type="submit" className="w-full rounded-xl h-12 text-base font-bold shadow-lg shadow-primary/20">
                      Daftar Gratis Sekarang
                    </Button>
                  </form>
                ) : (
                  <form action="/api/admin/academy/checkout" method="POST">
                    <input type="hidden" name="courseId" value={course.id} />
                    <Button type="submit" className="w-full rounded-xl h-12 text-base font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20">
                      Beli Divisi Ini
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
