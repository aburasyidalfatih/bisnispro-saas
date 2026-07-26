"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Globe } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { setCookie } from "cookies-next"

export function LanguageSwitcher() {
  const router = useRouter()

  const switchLocale = (locale: string) => {
    setCookie('NEXT_LOCALE', locale, { path: '/', maxAge: 31536000 })
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
          <Globe className="h-4 w-4" />
          <span className="sr-only">Switch Language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => switchLocale('id')}>🇮🇩 Indonesia</DropdownMenuItem>
        <DropdownMenuItem onClick={() => switchLocale('en')}>🇬🇧 English</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
