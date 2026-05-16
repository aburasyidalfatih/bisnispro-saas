import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface PageHeaderProps {
  title: React.ReactNode
  description?: React.ReactNode
  breadcrumbs: BreadcrumbItem[]
}

export function PageHeader({ title, description, breadcrumbs }: PageHeaderProps) {
  return (
    <div className="relative bg-primary/5 dark:bg-primary/10 border-b border-border/50 pt-8 pb-10 overflow-hidden">
      {/* Decorative Ornaments (Dynamic to Theme Color) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Background blobs */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-bl from-primary/20 via-primary/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-gradient-to-tr from-primary/15 via-primary/5 to-transparent rounded-full blur-3xl" />
        
        {/* Premium Grid Pattern */}
        <svg className="absolute inset-0 h-full w-full opacity-[0.04] dark:opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="header-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M0 32V.5H32" fill="none" className="stroke-primary" strokeWidth="1"></path>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#header-grid)"></rect>
        </svg>

        {/* Floating Abstract Elements */}
        <div className="absolute top-[20%] right-[12%] w-4 h-4 rounded-full border-2 border-primary/40 animate-[bounce_4s_infinite]" />
        <div className="absolute bottom-[25%] left-[10%] w-3 h-3 rounded-full bg-primary/30 animate-pulse" />
        <div className="absolute top-[60%] right-[25%] w-2 h-2 rounded-full bg-primary/40" />
        
        {/* Decorative lines */}
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-primary/10 to-transparent" />
        <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      </div>
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-primary transition-colors">
            <Home className="h-4 w-4" />
          </Link>
          {breadcrumbs.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <ChevronRight className="h-4 w-4 opacity-50" />
              {item.href ? (
                <Link href={item.href} className="hover:text-primary transition-colors font-medium">
                  {item.label}
                </Link>
              ) : (
                <span className="text-primary font-bold">{item.label}</span>
              )}
            </div>
          ))}
        </nav>

        {/* Title & Description */}
        <div className="max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-primary mb-4">
            {title}
          </h1>
          {description && (
            <p className="text-lg text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
