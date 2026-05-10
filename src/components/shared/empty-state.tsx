import React from "react"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-saas-card bg-slate-50/50 border border-dashed border-slate-200", className)}>
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/5 text-primary rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-sm">
        <Icon className="w-8 h-8 sm:w-10 sm:h-10 opacity-80" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6 leading-relaxed">
        {description}
      </p>
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  )
}
