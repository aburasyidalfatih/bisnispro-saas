"use client"

import { Button } from"@/components/ui/button"
import { Printer } from"lucide-react"

export function PrintButton({ count }: { count: number }) {
  return (
    <Button 
      onClick={() => window.print()} 
      className="rounded-lg border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 gap-2 w-full sm:w-auto"
    >
      <Printer className="h-4 w-4" /> Cetak {count} Kartu
    </Button>
  )
}
