import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center">
      {/* Skeleton Pulse Logo */}
      <div className="relative h-24 w-24 rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden mb-6 shadow-sm border border-gray-100">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse" style={{ backgroundSize: '200% 100%' }} />
        <Loader2 className="h-10 w-10 text-primary animate-spin relative z-10" />
      </div>

      {/* Shimmer Texts */}
      <div className="flex flex-col items-center space-y-3 w-64">
        <div className="h-5 w-3/4 bg-gray-200 rounded-full animate-pulse" />
        <div className="h-3 w-1/2 bg-gray-100 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
      </div>
      
      {/* Background glass blur */}
      <div className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
    </div>
  )
}
