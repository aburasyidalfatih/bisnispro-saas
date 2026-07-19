"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet"
import { useTheme } from "next-themes"
import MarkerClusterGroup from "react-leaflet-cluster"
import "leaflet/dist/leaflet.css"

interface MapPoint {
  lat: number
  lng: number
  name: string
  type: "tenant" | "application"
  slug?: string
}

export default function MapContent({ points }: { points: MapPoint[] }) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  
  const tileUrl = isDark 
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" // Menggunakan OSM standar yang jauh lebih detail dan presisi jalannya

  return (
    <div className="rounded-xl overflow-hidden border border-border/50 shadow-inner" style={{ height: 500 }}>
      <MapContainer
        center={[-2.5, 118]}
        zoom={5}
        style={{ height: "100%", width: "100%", background: isDark ? "#0f172a" : "#f8fafc" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          key={tileUrl}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url={tileUrl}
        />
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={40}
        >
          {points.map((point, idx) => (
            <CircleMarker
              key={`${point.type}-${idx}`}
              center={[point.lat, point.lng]}
              radius={point.type === "tenant" ? 5 : 4}
              pathOptions={{
                color: isDark ? "#0f172a" : "#ffffff", // Border putih agar tiap titik tidak menyatu
                fillColor: point.type === "tenant" ? "#10b981" : "#f59e0b",
                fillOpacity: 1,
                weight: 1.5,
              }}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-bold">{point.name}</p>
                  <p className="text-xs mt-1" style={{ color: point.type === "tenant" ? "#10b981" : "#f59e0b" }}>
                    {point.type === "tenant" ? "🟢 Sekolah Aktif" : "🟠 Pengajuan"}
                  </p>
                  {point.slug && (
                    <p className="text-xs text-gray-500 mt-0.5">{point.slug}.schoolpro.id</p>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  )
}
