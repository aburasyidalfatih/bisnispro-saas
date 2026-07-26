export default function SuperAdminAuditLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="skeleton h-8 w-40" />
        <div className="skeleton h-4 w-72" />
      </div>
      <div className="skeleton h-10 w-72 rounded-xl" />
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton h-16 w-full rounded-2xl" style={{ animationDelay: `${i * 75}ms` }} />
        ))}
      </div>
    </div>
  )
}
