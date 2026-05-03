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

  let googleClientId = process.env.GOOGLE_CLIENT_ID
  let googleClientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (isMainDomain) {
    const settings = await db.platformSetting.findMany({
      where: { key: { in: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"] } }
    })
    const map = Object.fromEntries(settings.map(s => [s.key, s.value]))
    if (map.GOOGLE_CLIENT_ID) googleClientId = map.GOOGLE_CLIENT_ID
    if (map.GOOGLE_CLIENT_SECRET) googleClientSecret = map.GOOGLE_CLIENT_SECRET
  } else {
    const slug = hostWithoutPort.replace(`.${rootDomain}`, "").split('.')[0]
    const tenant = await db.tenant.findUnique({ where: { slug }, select: { googleClientId: true, googleClientSecret: true } })
    if (tenant?.googleClientId && tenant?.googleClientSecret) {
      googleClientId = tenant.googleClientId
      googleClientSecret = tenant.googleClientSecret
    }
  }

  // Clone config to avoid mutating the global one
  const config = { ...authOptions }
  
  // Remove existing Google provider if any
  config.providers = config.providers.filter((p: any) => p?.id !== "google")
  
  // Inject the dynamic Google provider
  if (googleClientId && googleClientSecret) {
    config.providers.push(Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      allowDangerousEmailAccountLinking: false,
    }))
  }

  return config
}

export async function GET(req: NextRequest, ctx: any) {
  const config = await getDynamicConfig(req)
  // @ts-ignore - NextAuth handlers expect 1 arg in types, but Next.js router needs ctx
  return NextAuth(config).handlers.GET(req, ctx)
}

export async function POST(req: NextRequest, ctx: any) {
  const config = await getDynamicConfig(req)
  // @ts-ignore - NextAuth handlers expect 1 arg in types, but Next.js router needs ctx
  return NextAuth(config).handlers.POST(req, ctx)
}
