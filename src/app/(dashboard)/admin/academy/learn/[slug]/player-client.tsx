"use client"
import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronLeft, PlayCircle, CheckCircle2, FileText, ChevronRight, Menu, X, Loader2, GraduationCap } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import DOMPurify from "isomorphic-dompurify"
import { EmptyState } from "@/components/ui/empty-state"

export function AcademyPlayer({ course }: { course: any }) {
  const router = useRouter()
  // Flatten all lessons into a single array for easy prev/next navigation
  const allLessons = useMemo(() => course.modules.flatMap((m: any) => m.lessons), [course.modules])
  
  const [activeLesson, setActiveLesson] = useState<any>(allLessons[0])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loadingComplete, setLoadingComplete] = useState(false)
  
  // Track local completion state so UI updates instantly
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Initialize completed lessons from DB
    const completed = new Set<string>()
    allLessons.forEach((l: any) => {
      if (l.progresses && l.progresses.some((p: any) => p.completed)) {
        completed.add(l.id)
      }
    })
    setCompletedLessonIds(completed)
  }, [allLessons])

  if (!activeLesson) return (
    <div className="h-full flex items-center justify-center p-10 w-full">
      <EmptyState icon={GraduationCap} title="Belum Ada Materi" description="Belum ada materi di divisi ini." />
    </div>
  )

  const currentIndex = allLessons.findIndex((l: any) => l.id === activeLesson.id)
  const hasNext = currentIndex < allLessons.length - 1
  const hasPrev = currentIndex > 0

  const handleComplete = async () => {
    setLoadingComplete(true)
    try {
      const res = await fetch(`/api/admin/academy/lessons/${activeLesson.id}/complete`, {
        method: "POST"
      })
      if (res.ok) {
        toast({ title: "Selesai!", description: "Materi ditandai sebagai selesai." })
        setCompletedLessonIds(new Set([...completedLessonIds, activeLesson.id]))
        router.refresh()
        
        // Auto go to next if available
        if (hasNext) {
          setTimeout(() => setActiveLesson(allLessons[currentIndex + 1]), 1000)
        }
      }
    } catch (e) {
      toast({ title: "Gagal", description: "Gagal menyimpan progress.", variant: "destructive" })
    } finally {
      setLoadingComplete(false)
    }
  }

  const isCompleted = completedLessonIds.has(activeLesson.id)

  const renderVideo = () => {
    if (!activeLesson.videoUrl) return null
    let embedUrl = activeLesson.videoUrl
    if (embedUrl.includes("youtube.com/watch?v=")) {
      embedUrl = embedUrl.replace("watch?v=", "embed/")
    } else if (embedUrl.includes("youtu.be/")) {
      embedUrl = embedUrl.replace("youtu.be/", "youtube.com/embed/")
    }
    
    return (
      <div className="relative w-full aspect-video bg-black">
        <iframe
          src={embedUrl}
          className="absolute top-0 left-0 w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    )
  }

  return (
    <div className="flex w-full h-full relative">
      {/* Main Content */}
      <div className={cn("flex-1 flex flex-col h-full transition-all duration-300", sidebarOpen ? "lg:mr-80" : "")}>
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b bg-background z-10 shrink-0">
          <div className="flex items-center gap-4">
            <Link href={`/admin/academy/${course.slug}`}>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted"><ChevronLeft className="h-5 w-5" /></Button>
            </Link>
            <h1 className="font-semibold text-lg line-clamp-1">{course.title}</h1>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden rounded-full" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </header>

        <ScrollArea className="flex-1 bg-muted/20">
          <div className="max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 pb-24">
            {renderVideo()}
            
            <div className="mt-8 space-y-6">
              <h2 className="text-2xl sm:text-3xl font-bold">{activeLesson.title}</h2>
              
              {activeLesson.content && (
                <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none bg-card p-6 rounded-2xl border shadow-sm" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(activeLesson.content, { ADD_TAGS: ["iframe", "video", "source"], ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling", "controls"] }) }} />
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t">
                <Button 
                  variant="outline" 
                  disabled={!hasPrev} 
                  onClick={() => setActiveLesson(allLessons[currentIndex - 1])}
                  className="w-full sm:w-auto rounded-xl gap-2"
                >
                  <ChevronLeft className="h-4 w-4" /> Sebelumnya
                </Button>
                
                <Button 
                  onClick={handleComplete} 
                  disabled={isCompleted || loadingComplete}
                  className={cn("w-full sm:w-auto rounded-xl gap-2 font-bold", isCompleted ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "")}
                >
                  {loadingComplete ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  {isCompleted ? "Selesai" : "Tandai Selesai"}
                </Button>

                <Button 
                  variant="outline" 
                  disabled={!hasNext} 
                  onClick={() => setActiveLesson(allLessons[currentIndex + 1])}
                  className="w-full sm:w-auto rounded-xl gap-2"
                >
                  Selanjutnya <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Sidebar Playlist */}
      <div className={cn("fixed lg:absolute top-0 right-0 h-full w-80 bg-background border-l shadow-2xl lg:shadow-none z-20 flex flex-col transition-transform duration-300", sidebarOpen ? "translate-x-0" : "translate-x-full")}>
        <div className="h-16 flex items-center justify-between px-6 border-b shrink-0 bg-muted/10">
          <h3 className="font-bold">Materi Divisi</h3>
          <Button variant="ghost" size="icon" className="lg:hidden rounded-full" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {course.modules.map((mod: any, mIdx: number) => (
              <div key={mod.id} className="space-y-2">
                <h4 className="font-semibold text-sm px-2 text-muted-foreground flex items-center gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded bg-muted flex items-center justify-center text-[10px]">{mIdx + 1}</span>
                  {mod.title}
                </h4>
                <div className="space-y-1">
                  {mod.lessons.map((les: any, lIdx: number) => {
                    const isActive = activeLesson.id === les.id
                    const isLessonCompleted = completedLessonIds.has(les.id)
                    return (
                      <button
                        key={les.id}
                        onClick={() => { setActiveLesson(les); if(window.innerWidth < 1024) setSidebarOpen(false) }}
                        className={cn(
                          "w-full text-left flex items-start gap-3 p-3 rounded-xl transition-all duration-200 border border-transparent hover:bg-muted/50",
                          isActive ? "bg-primary/5 border-primary/20 shadow-sm" : ""
                        )}
                      >
                        <div className="mt-0.5 shrink-0">
                          {isLessonCompleted ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : les.videoUrl ? (
                            <PlayCircle className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                          ) : (
                            <FileText className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={cn("text-sm font-medium leading-tight", isActive ? "text-primary" : "text-foreground")}>
                            {lIdx + 1}. {les.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1">{les.duration} mnt</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
