export default function AffiliateLoading() {
  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="space-y-2">
        <div className="skeleton h-8 w-56" />
        <div className="skeleton h-4 w-80" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton h-[130px] rounded-2xl" style={{ animationDelay: `${i * 75}ms` }} />
        ))}
      </div>
      <div className="skeleton h-32 rounded-2xl" style={{ animationDelay: "225ms" }} />
      <div className="skeleton h-80 rounded-2xl" style={{ animationDelay: "300ms" }} />
    </div>
  )
}
