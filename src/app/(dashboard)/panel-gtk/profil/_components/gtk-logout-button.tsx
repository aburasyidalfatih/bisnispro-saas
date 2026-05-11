"use client"

import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"
import { useState } from "react"
import { Loader2 } from "lucide-react"

export function GtkLogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await signOut({ redirect: false })
      // Secara eksplisit kembalikan ke /login pada domain/tenant saat ini
      window.location.href = "/login"
    } catch (error) {
      console.error(error)
      setIsLoggingOut(false)
    }
  }

  return (
    <Button 
      variant="destructive" 
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="w-full sm:w-auto px-8 rounded-xl shadow-lg shadow-red-500/20"
    >
      {isLoggingOut ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="mr-2 h-4 w-4" />
      )}
      {isLoggingOut ? "Keluar..." : "Keluar Akun"}
    </Button>
  )
}
