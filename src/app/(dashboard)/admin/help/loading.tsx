export default function HelpLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-4 w-72" />
      </div>
      <div className="skeleton h-12 w-full max-w-xl rounded-xl" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton h-[140px] rounded-2xl" style={{ animationDelay: `${i * 75}ms` }} />
        ))}
      </div>
    </div>
  )
}
