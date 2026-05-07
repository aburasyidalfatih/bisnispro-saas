export default function NotificationsLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="skeleton h-8 w-40" />
          <div className="skeleton h-4 w-48" />
        </div>
        <div className="skeleton h-9 w-44 rounded-xl" />
      </div>
      <div className="rounded-2xl overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton h-[72px] w-full rounded-none border-b" style={{ animationDelay: `${i * 50}ms` }} />
        ))}
      </div>
    </div>
  )
}
