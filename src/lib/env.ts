const REQUIRED_PRODUCTION_ENV = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "NEXT_PUBLIC_ROOT_DOMAIN",
  "INTERNAL_API_SECRET",
  "CRON_SECRET",
] as const

function hasSharedRedis() {
  return Boolean(
    process.env.REDIS_URL ||
      (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  )
}

export function validateProductionEnv() {
  if (process.env.NODE_ENV !== "production") return

  const missing: string[] = REQUIRED_PRODUCTION_ENV.filter((key) => !process.env[key])

  if (!hasSharedRedis()) {
    missing.push("REDIS_URL or UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN")
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required production environment variables: ${missing.join(", ")}`
    )
  }
}
