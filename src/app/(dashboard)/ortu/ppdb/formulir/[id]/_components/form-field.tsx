import { Label } from "@/components/ui/label"
import React from "react"

export function FormField({ label, required, children }: { label: string, required?: boolean, children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-muted-foreground">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
    </div>
  )
}
