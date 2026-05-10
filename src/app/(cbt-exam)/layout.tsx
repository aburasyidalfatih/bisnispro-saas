import { ReactNode } from "react"
import { TenantBrandingProvider } from "@/components/providers/tenant-branding-provider"

export default function CbtExamLayout({ children }: { children: ReactNode }) {
  // This layout deliberately omits sidebars, headers, and bottom navs
  // to create a fully isolated fullscreen environment for the exam.
  return (
    <TenantBrandingProvider>
      <div className="min-h-screen bg-slate-50 font-sans selection:bg-primary/30">
        {children}
      </div>
    </TenantBrandingProvider>
  )
}
