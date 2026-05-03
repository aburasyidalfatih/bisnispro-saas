import { NextRequest } from "next/server"
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

async function getDynamicConfig(req: NextRequest) {
  const host = req.nextUrl.hostname
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "schoolpro.my.id"
  const hostWithoutPort = host.split(":")[0]
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
  const config = await getDynamicConfig(req)
  // @ts-ignore — NextAuth v5 handlers need ctx for dynamic routes
  return NextAuth(config).handlers.GET(req, ctx)
}

export async function POST(req: NextRequest, ctx: any) {
  const config = await getDynamicConfig(req)
  // @ts-ignore — NextAuth v5 handlers need ctx for dynamic routes
  return NextAuth(config).handlers.POST(req, ctx)
}
