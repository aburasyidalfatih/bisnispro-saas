export default function UsersLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="skeleton h-8 w-40" />
          <div className="skeleton h-4 w-56" />
        </div>
        <div className="skeleton h-10 w-36 rounded-xl" />
      </div>
      <div className="skeleton h-10 w-72 rounded-xl" />
      <div className="skeleton h-[400px] rounded-2xl" />
    </div>
  )
}
