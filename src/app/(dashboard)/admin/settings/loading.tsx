export default function SettingsLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="space-y-2">
        <div className="skeleton h-8 w-40" />
        <div className="skeleton h-4 w-64" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="skeleton h-[300px] rounded-2xl" />
        <div className="skeleton h-[300px] rounded-2xl" />
      </div>
    </div>
  )
}
