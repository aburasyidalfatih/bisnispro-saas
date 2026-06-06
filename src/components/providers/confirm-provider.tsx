"use client"

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { AlertCircle, Trash2, Info, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ConfirmOptions {
  title: string
  description: ReactNode
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive" | "info" | "success"
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined)

export const useConfirm = () => {
  const context = useContext(ConfirmContext)
  if (!context) throw new Error("useConfirm must be used within ConfirmProvider")
  return context
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const [resolver, setResolver] = useState<(value: boolean) => void>()

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts)
    setIsOpen(true)
    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve)
    })
  }, [])

  const handleConfirm = () => {
    resolver?.(true)
    setIsOpen(false)
  }

  const handleCancel = () => {
    resolver?.(false)
    setIsOpen(false)
  }

  const Icon = () => {
    if (options?.variant === "destructive") return <Trash2 className="h-7 w-7 text-red-600" />
    if (options?.variant === "info") return <Info className="h-7 w-7 text-blue-600" />
    if (options?.variant === "success") return <CheckCircle2 className="h-7 w-7 text-emerald-600" />
    return <AlertCircle className="h-7 w-7 text-primary" />
  }

  const iconBg = () => {
    if (options?.variant === "destructive") return "bg-red-100"
    if (options?.variant === "info") return "bg-blue-100"
    if (options?.variant === "success") return "bg-emerald-100"
    return "bg-primary/10"
  }

  const actionClass = () => {
    if (options?.variant === "destructive") return "bg-red-600 hover:bg-red-700 text-white"
    if (options?.variant === "info") return "bg-blue-600 hover:bg-blue-700 text-white"
    if (options?.variant === "success") return "bg-emerald-600 hover:bg-emerald-700 text-white"
    return "btn-gradient text-white"
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent className="sm:max-w-[425px] overflow-hidden rounded-[2rem] glass border border-white/20 dark:border-white/5 shadow-2xl p-0 max-w-full">
          <div className="px-6 pt-10 pb-6 text-center flex flex-col items-center relative">
            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-primary/5 to-transparent -z-10" />
            <div className={cn("mx-auto flex h-20 w-20 items-center justify-center rounded-full mb-6 ring-8 ring-background shadow-lg", iconBg())}>
              <Icon />
            </div>
            <AlertDialogHeader className="text-center w-full">
              <AlertDialogTitle className="text-2xl font-extrabold text-center w-full">{options?.title}</AlertDialogTitle>
              <AlertDialogDescription className="text-center pt-2 text-sm leading-relaxed w-full">
                {options?.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter className="px-6 pb-8 pt-2 flex flex-col sm:flex-row items-center justify-center sm:justify-center gap-3 w-full">
            <AlertDialogCancel onClick={handleCancel} className="mt-0 w-full sm:w-1/2 rounded-2xl h-12 border-border/50 hover:bg-muted/50 font-bold transition-colors">
              {options?.cancelText || "Batal"}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} className={cn("mt-0 w-full sm:w-1/2 rounded-2xl h-12 font-bold shadow-lg transition-transform active:scale-95", actionClass())}>
              {options?.confirmText || "Ya, Lanjutkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  )
}
