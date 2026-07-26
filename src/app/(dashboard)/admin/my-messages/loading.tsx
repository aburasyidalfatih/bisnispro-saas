export default function MyMessagesLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[550px]">
        <div className="skeleton h-full rounded-2xl" />
        <div className="md:col-span-2 skeleton h-full rounded-2xl" style={{ animationDelay: "150ms" }} />
      </div>
    </div>
  )
}
