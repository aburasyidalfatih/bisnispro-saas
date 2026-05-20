"use client"

import React from "react"
import { LucideIcon } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  secondaryAction?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-dashed border-muted-foreground/20 bg-gradient-to-b from-card to-muted/10 p-8 text-center shadow-sm relative overflow-hidden",
        className
      )}
    >
      {/* Decorative Aura */}
      <div className="absolute -top-24 h-48 w-48 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      {/* Premium Dynamic Icon Ring */}
      <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 mb-6 border border-primary/20 shadow-inner group pointer-events-none">
        <div className="absolute inset-0 rounded-full bg-primary/5 animate-ping opacity-75" />
        <Icon className="h-10 w-10 text-primary transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
      </div>

      <h3 className="text-xl font-bold tracking-tight text-foreground">{title}</h3>
      {description && (
        <p className="mt-2 mb-6 text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      )}

      {/* Flexible Action Container */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center mt-4">
          {secondaryAction && <div className="z-10">{secondaryAction}</div>}
          {action && <div className="z-10">{action}</div>}
        </div>
      )}
    </motion.div>
  )
}
