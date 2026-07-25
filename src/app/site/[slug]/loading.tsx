import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center">
      {/* Skeleton Pulse Logo */}
      <div className="relative h-24 w-24 rounded-2xl bg-muted flex items-center justify-center overflow-hidden mb-6 shadow-sm border border-border">
        <div className="absolute inset-0 bg-gradient-to-r from-muted via-muted/80 to-muted animate-pulse" style={{ backgroundSize: '200% 100%' }} />
        <Loader2 className="h-10 w-10 text-primary animate-spin relative z-10" />
      </div>

      {/* Shimmer Texts */}
      <div className="flex flex-col items-center space-y-3 w-64">
        <div className="h-5 w-3/4 bg-muted/80 rounded-full animate-pulse" />
        <div className="h-3 w-1/2 bg-muted rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
      </div>
      
      {/* Background glass blur */}
      <div className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
    </div>
  )
}
