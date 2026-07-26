export default function SuperAdminRetentionLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-4 w-72" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton h-[120px] rounded-2xl" style={{ animationDelay: `${i * 75}ms` }} />
        ))}
      </div>
      <div className="skeleton h-[360px] rounded-2xl" style={{ animationDelay: "225ms" }} />
    </div>
  )
}
