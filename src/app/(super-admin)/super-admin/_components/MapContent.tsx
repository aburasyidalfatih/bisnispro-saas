"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"

interface MapPoint {
  lat: number
  lng: number
  name: string
  type: "tenant" | "application"
  slug?: string
}

export default function MapContent({ points }: { points: MapPoint[] }) {
  return (
    <div className="rounded-xl overflow-hidden border" style={{ height: 500 }}>
      <MapContainer
        center={[-2.5, 118]}
        zoom={5}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((point, idx) => (
          <CircleMarker
            key={`${point.type}-${idx}`}
            center={[point.lat, point.lng]}
            radius={point.type === "tenant" ? 8 : 6}
            pathOptions={{
              color: point.type === "tenant" ? "#10b981" : "#f59e0b",
              fillColor: point.type === "tenant" ? "#10b981" : "#f59e0b",
              fillOpacity: 0.8,
              weight: 2,
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
      </MapContainer>
    </div>
  )
}
