import { Metadata } from "next"
import { headers } from "next/headers"
import { db } from "@/lib/db"

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const host = headersList.get("host") || ""
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "schoolpro.id"
  const hostWithoutPort = host.split(":")[0]
  
  const isMainDomain = 
    hostWithoutPort === "localhost" || 
    hostWithoutPort === rootDomain || 
    hostWithoutPort === `www.${rootDomain}`

  if (!isMainDomain) {
    // Determine slug for subdomain, or use full host for custom domain
    let slug = hostWithoutPort
    if (hostWithoutPort.endsWith(`.${rootDomain}`)) {
      slug = hostWithoutPort.replace(`.${rootDomain}`, "")
    }

    try {
      const tenant = await db.tenant.findFirst({
        where: {
          OR: [
            { slug },
            { domain: hostWithoutPort }
          ]
        },
        select: { name: true, logo: true }
      })

      if (tenant?.logo) {
        return {
          title: `Login - ${tenant.name}`,
          icons: {
            icon: tenant.logo,
            apple: tenant.logo,
          }
        }
      }
    } catch (error) {
      // Ignore DB errors
    }
  }

  return {}
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
