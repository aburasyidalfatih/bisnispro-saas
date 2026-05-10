import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-24">
      {/* Header Skeleton */}
      <Skeleton className="h-40 sm:h-48 w-full rounded-saas-card" />
      
      {/* Main Stats / Menus Skeleton */}
      <div>
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-24 sm:h-28 rounded-saas-widget" />
          ))}
        </div>
      </div>

      {/* Two Column Layout Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-[200px] rounded-saas-card" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-[200px] rounded-saas-card" />
        </div>
      </div>
    </div>
  )
}
