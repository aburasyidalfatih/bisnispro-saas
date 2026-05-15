import { headers } from "next/headers"
import { checkIsMainDomain, getRootDomain } from "@/lib/utils"
import { getPublicTenantBySlug } from "@/lib/services/tenant-public"

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const headerList = await headers()
  let host = headerList.get("x-forwarded-host") || headerList.get("host") || "schoolpro.id"
  host = host.split(':')[0]
  
  const isMainDomain = checkIsMainDomain(host)
  let theme = "aurora"
  
  if (!isMainDomain) {
    const rootDomain = getRootDomain(host)
    const slug = host.replace(`.${rootDomain}`, "").split('.')[0]
    const tenant = await getPublicTenantBySlug(slug)
    
    if (tenant && tenant.theme) {
      theme = tenant.theme
    }
  }

  return (
    <>
      {/* 
        Menyuntikkan tema secara sinkron langsung ke DOM HTML sebelum komponen React di-render (Hydration). 
        Ini akan menghilangkan kedipan tema (Theme Flash) 100%. 
      */}
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.setAttribute("data-theme", "${theme}");`
        }}
      />
      {children}
    </>
  )
}
