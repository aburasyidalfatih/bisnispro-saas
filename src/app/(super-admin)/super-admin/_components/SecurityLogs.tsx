"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShieldAlert, Shield, AlertTriangle, ShieldCheck } from "lucide-react"

interface SecurityLog {
  id: string
  ipAddress: string
  path: string
  payload: string | null
  attackType: string
  severity: string
  createdAt: string
}

export function SecurityLogs() {
  const [logs, setLogs] = useState<SecurityLog[]>([])
  const [bannedIps, setBannedIps] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [blockingIp, setBlockingIp] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch("/api/super-admin/security-logs?limit=5").then((res) => res.json()),
      fetch("/api/super-admin/banned-ips").then((res) => res.json()),
    ])
      .then(([logsData, bannedData]) => {
        if (Array.isArray(logsData)) setLogs(logsData)
        if (Array.isArray(bannedData)) setBannedIps(bannedData)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleBlockIp = async (ipAddress: string) => {
    if (!confirm(`Anda yakin ingin memblokir IP ${ipAddress} secara permanen? Mereka tidak akan bisa mengakses platform sama sekali.`)) return
    
    setBlockingIp(ipAddress)
    try {
      const res = await fetch("/api/super-admin/banned-ips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ipAddress, reason: "Manual blokir dari dashboard" })
      })
      if (res.ok) {
        setBannedIps((prev) => [...prev, ipAddress])
      }
    } catch (error) {
      console.error(error)
    } finally {
      setBlockingIp(null)
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity.toUpperCase()) {
      case "CRITICAL":
        return <Badge variant="destructive" className="bg-red-500">Bahaya Tinggi</Badge>
      case "HIGH":
        return <Badge variant="destructive" className="bg-orange-500">Waspada</Badge>
      default:
        return <Badge variant="secondary">Rendah</Badge>
    }
  }

  const getActionRecommendation = (attackType: string) => {
    switch (attackType) {
      case "SQLi":
        return "Blokir IP & Periksa Celah Query"
      case "XSS":
        return "Blokir IP & Validasi Input Form"
      case "LFI/Path Traversal":
        return "Blokir IP & Periksa Izin Direktori"
      default:
        return "Pantau Aktivitas IP"
    }
  }

  return (
    <Card className="glass border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              Aktivitas Mencurigakan (WAF & IDS)
            </CardTitle>
            <CardDescription>Pemantauan upaya peretasan dan anomali secara real-time</CardDescription>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <ShieldCheck className="w-3 h-3 mr-1" /> WAF Aktif
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/20 rounded-xl border border-dashed">
            <Shield className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium">Sistem Aman</p>
            <p className="text-xs text-muted-foreground">Tidak ada aktivitas mencurigakan yang terdeteksi.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4 py-3 font-medium rounded-tl-lg">Waktu</TableHead>
                  <TableHead className="px-4 py-3 font-medium">IP Address</TableHead>
                  <TableHead className="px-4 py-3 font-medium">Tipe Serangan</TableHead>
                  <TableHead className="px-4 py-3 font-medium">Tingkat Bahaya</TableHead>
                  <TableHead className="px-4 py-3 font-medium rounded-tr-lg">Tindakan Disarankan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="px-4 py-3 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </TableCell>
                    <TableCell className="px-4 py-3 font-mono text-xs">{log.ipAddress}</TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-1.5 font-medium text-red-600 dark:text-red-400">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {log.attackType}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">{getSeverityBadge(log.severity)}</TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground">
                      {bannedIps.includes(log.ipAddress) ? (
                        <Badge variant="destructive" className="bg-red-800 text-white">IP TERBLOKIR</Badge>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs">{getActionRecommendation(log.attackType)}</span>
                          <button
                            onClick={() => handleBlockIp(log.ipAddress)}
                            disabled={blockingIp === log.ipAddress}
                            className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded transition-colors disabled:opacity-50"
                          >
                            {blockingIp === log.ipAddress ? "Memblokir..." : "Blokir IP"}
                          </button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
