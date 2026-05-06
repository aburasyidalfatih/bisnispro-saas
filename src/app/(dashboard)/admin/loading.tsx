export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title skeleton */}
      <div className="space-y-2">
        <div className="skeleton h-8 w-64" />
        <div className="skeleton h-4 w-80" />
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-[120px] rounded-2xl" style={{ animationDelay: `${i * 75}ms` }} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="skeleton h-[360px] rounded-2xl" style={{ animationDelay: "300ms" }} />
        <div className="skeleton h-[360px] rounded-2xl" style={{ animationDelay: "375ms" }} />
      </div>
    </div>
  )
}
