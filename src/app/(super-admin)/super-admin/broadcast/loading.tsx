export default function SuperAdminBroadcastLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="skeleton h-8 w-48" />
          <div className="skeleton h-4 w-72" />
        </div>
        <div className="skeleton h-10 w-36 rounded-xl" />
      </div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton h-20 w-full rounded-2xl" style={{ animationDelay: `${i * 75}ms` }} />
        ))}
      </div>
    </div>
  )
}
