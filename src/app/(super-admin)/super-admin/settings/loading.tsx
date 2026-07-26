export default function SuperAdminSettingsLoading() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="space-y-2">
        <div className="skeleton h-8 w-40" />
        <div className="skeleton h-4 w-64" />
      </div>
      <div className="space-y-4">
        <div className="skeleton h-[280px] rounded-2xl" />
        <div className="skeleton h-[280px] rounded-2xl" style={{ animationDelay: "150ms" }} />
      </div>
    </div>
  )
}
