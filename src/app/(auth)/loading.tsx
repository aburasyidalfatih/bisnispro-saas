export default function AuthLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-4 bg-background">
      <div className="skeleton h-16 w-16 rounded-full" />
      <div className="skeleton h-6 w-32" />
      <div className="skeleton h-4 w-48" />
    </div>
  )
}
