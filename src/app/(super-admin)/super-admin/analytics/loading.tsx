export default function SuperAdminAnalyticsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="skeleton h-8 w-56" />
        <div className="skeleton h-4 w-80" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-[120px] rounded-2xl" style={{ animationDelay: `${i * 75}ms` }} />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="skeleton h-[360px] rounded-2xl" style={{ animationDelay: "300ms" }} />
        <div className="skeleton h-[360px] rounded-2xl" style={{ animationDelay: "375ms" }} />
      </div>
    </div>
  )
}
