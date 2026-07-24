import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const hostname = req.headers.get("host") || ""
  
  let rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "bisnispro.id"
  if (hostname.endsWith("bisnispro.my.id") || hostname === "bisnispro.my.id") {
    rootDomain = "bisnispro.my.id"
  } else if (hostname.endsWith("bisnispro.id") || hostname === "bisnispro.id") {
    rootDomain = "bisnispro.id"
  }

  const isMainDomain =
    hostname === rootDomain ||
    hostname === `www.${rootDomain}` ||
    hostname === "localhost" ||
    hostname.startsWith("localhost:") ||
    hostname === "127.0.0.1"

  const subdomain = hostname.endsWith(`.${rootDomain}`)
    ? hostname.replace(`.${rootDomain}`, "")
    : ""

  const isSubdomain = !isMainDomain && subdomain !== "" && subdomain !== "www"
  const isCustomDomain = !isMainDomain && !isSubdomain

  return NextResponse.json({
    hostname,
    rootDomain,
    isMainDomain,
    subdomain,
    isSubdomain,
    isCustomDomain,
    headers: Object.fromEntries(req.headers.entries())
  })
}
