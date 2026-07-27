"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"

const statuses = ["NEW", "REVIEWING", "QUOTED", "WON", "REJECTED"] as const
export function RfqStatusControl({ id, initialStatus }: { id: string; initialStatus: string }) {
  const [status, setStatus] = useState(initialStatus)
  const [saving, setSaving] = useState(false)
  async function save(next: string) { setStatus(next); setSaving(true); try { const response = await fetch(`/api/tenant/rfq/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) }); if (!response.ok) throw new Error(); toast({ title: "Lead updated", description: `Status moved to ${next.toLowerCase()}.` }) } catch { setStatus(initialStatus); toast({ title: "Update failed", variant: "destructive" }) } finally { setSaving(false) } }
  return <Select value={status} onValueChange={save} disabled={saving}><SelectTrigger className="h-8 w-[132px] text-xs"><SelectValue /></SelectTrigger><SelectContent>{statuses.map(item => <SelectItem key={item} value={item}>{item.charAt(0) + item.slice(1).toLowerCase()}</SelectItem>)}</SelectContent></Select>
}
