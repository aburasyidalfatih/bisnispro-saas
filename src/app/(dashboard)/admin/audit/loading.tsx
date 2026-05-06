export default function AuditLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="space-y-2">
        <div className="skeleton h-8 w-32" />
        <div className="skeleton h-4 w-72" />
      </div>
      <div className="skeleton h-10 w-72 rounded-xl" />
      <div className="rounded-2xl overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton h-[64px] w-full rounded-none border-b" style={{ animationDelay: `${i * 50}ms` }} />
        ))}
      </div>
    </div>
  )
}
