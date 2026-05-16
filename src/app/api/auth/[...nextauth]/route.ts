import { NextRequest } from "next/server"
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { authRateLimit } from "@/lib/edge-rate-limit"

export const dynamic = "force-dynamic"

async function getDynamicConfig(req: NextRequest) {
  // PENTING: Di belakang reverse proxy (nginx → Docker), req.nextUrl.hostname
  // mengembalikan nama container internal (misal: schoolpro-dev-app), bukan domain asli.
  // Gunakan X-Forwarded-Host atau Host header, sama seperti middleware.ts
  const rawHost =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    req.nextUrl.hostname
  const hostWithoutPort = rawHost.split(":")[0]

  const rootDomain = process.env.AUTH_URL ? process.env.AUTH_URL.replace("https://", "").replace("http://", "") : (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "schoolpro.id")
  const isMainDomain =
    hostWithoutPort === "localhost" ||
    hostWithoutPort === rootDomain ||
    hostWithoutPort === `www.${rootDomain}`

  let googleClientId: string | undefined
  let googleClientSecret: string | undefined

  if (isMainDomain) {
    // Priority: database settings > environment variables
    const settings = await db.platformSetting.findMany({
      where: { key: { in: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"] } },
    })
    const map = Object.fromEntries(settings.filter(s => s.value).map(s => [s.key, s.value!]))
    googleClientId = map.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID
    googleClientSecret = map.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET
  } else {
    const slug = hostWithoutPort.replace(`.${rootDomain}`, "").split(".")[0]
    const tenant = await db.tenant.findUnique({
      where: { slug },
      select: { googleClientId: true, googleClientSecret: true },
    })
    googleClientId = tenant?.googleClientId ?? undefined
    googleClientSecret = tenant?.googleClientSecret ?? undefined
  }

  // Build providers list — start from base config (Credentials only), then add Google if available
  const providers = [...authOptions.providers.filter((p: any) => {
    // Keep only non-google providers (Credentials etc.)
    const id = typeof p === "function" ? p({})?.id : p?.id
    return id !== "google"
  })]

  if (googleClientId && googleClientSecret) {
    providers.push(
      Google({
        clientId: googleClientId,
        clientSecret: googleClientSecret,
      })
    )
  }

  return { ...authOptions, providers }
}

export async function GET(req: NextRequest, ctx: any) {
  try {
    const config = await getDynamicConfig(req)
    // @ts-ignore — NextAuth v5 handlers need ctx for dynamic routes
    return NextAuth(config).handlers.GET(req, ctx)
  } catch (error: any) {
    console.error("NEXTAUTH GET ERROR:", error);
    return new Response(JSON.stringify({ error: error.message || "Unknown error" }), { status: 500 })
  }
}

export async function POST(req: NextRequest, ctx: any) {
  // Enterprise Security: Rate limit login attempts to prevent Brute Force
  const ip = (req as any).ip ?? req.headers.get("x-forwarded-for") ?? "127.0.0.1"
  const { success } = await authRateLimit.limit(ip)
  if (!success) {
    return new Response(JSON.stringify({ error: "Terlalu banyak percobaan login. Silakan tunggu beberapa saat." }), { status: 429 })
  }

  const config = await getDynamicConfig(req)
  // @ts-ignore — NextAuth v5 handlers need ctx for dynamic routes
  return NextAuth(config).handlers.POST(req, ctx)
}
