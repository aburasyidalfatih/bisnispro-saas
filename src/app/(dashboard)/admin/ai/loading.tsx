export default function AiLoading() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="space-y-2">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-4 w-72" />
      </div>
      <div className="space-y-4">
        <div className="skeleton h-32 w-full rounded-2xl" />
        <div className="skeleton h-64 w-full rounded-2xl" style={{ animationDelay: "150ms" }} />
      </div>
    </div>
  )
}
