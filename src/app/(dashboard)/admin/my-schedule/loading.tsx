export default function MyScheduleLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="skeleton h-8 w-48" />
          <div className="skeleton h-4 w-72" />
        </div>
        <div className="skeleton h-10 w-32 rounded-xl" />
      </div>
      <div className="skeleton h-[550px] w-full rounded-2xl" style={{ animationDelay: "100ms" }} />
    </div>
  )
}
