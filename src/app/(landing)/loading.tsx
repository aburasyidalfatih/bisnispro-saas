export default function LandingLoading() {
  return (
    <div className="min-h-screen space-y-12 p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="skeleton h-10 w-36" />
        <div className="flex gap-4">
          <div className="skeleton h-10 w-20" />
          <div className="skeleton h-10 w-24 rounded-xl" />
        </div>
      </div>
      <div className="flex flex-col items-center text-center space-y-4 py-16">
        <div className="skeleton h-12 w-3/4 max-w-2xl" />
        <div className="skeleton h-6 w-1/2 max-w-lg" />
        <div className="skeleton h-12 w-40 rounded-xl mt-4" />
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton h-64 rounded-2xl" style={{ animationDelay: `${i * 100}ms` }} />
        ))}
      </div>
    </div>
  )
}
