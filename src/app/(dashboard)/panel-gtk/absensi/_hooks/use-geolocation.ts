"use client"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

type GeoState = "idle" | "loading" | "success" | "error"

export function useGeolocation() {
  const { toast, dismiss } = useToast()
  const [geoState, setGeoState] = useState<GeoState>("idle")
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [locationName, setLocationName] = useState("")

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Browser tidak mendukung GPS", variant: "destructive" })
      return
    }
    setGeoState("loading")
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        dismiss()
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocationName(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`)
        setGeoState("success")
      },
      (err) => {
        dismiss()
        setGeoState("error")
        toast({ title: "Gagal mendapatkan lokasi", description: err.message, variant: "destructive" })
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return { geoState, coords, locationName, getLocation }
}
