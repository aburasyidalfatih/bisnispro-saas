"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { requireTenantAccess } from "@/lib/guards/tenant-guard"

const WA_GATEWAY_URL = "http://localhost:4000"
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || ""

export async function getWaStatus(tenantId: string) {
  await requireTenantAccess(tenantId)
  
  const session = await db.waSession.findUnique({
    where: { tenantId },
    select: { status: true, qrCode: true, updatedAt: true }
  })
  
  return session || { status: 'DISCONNECTED', qrCode: null }
}

export async function startWaSession(tenantId: string) {
  await requireTenantAccess(tenantId)
  
  try {
    const response = await fetch(`${WA_GATEWAY_URL}/api/wa/session/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": INTERNAL_SECRET
      },
      body: JSON.stringify({ tenantId })
    })
    
    if (!response.ok) {
      throw new Error("Failed to start WA session on gateway")
    }
    
    return { success: true }
  } catch (error) {
    console.error("[startWaSession]", error)
    return { error: "Gagal menyambungkan ke server WhatsApp Gateway." }
  }
}

export async function logoutWaSession(tenantId: string) {
  await requireTenantAccess(tenantId)
  
  try {
    const response = await fetch(`${WA_GATEWAY_URL}/api/wa/session/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": INTERNAL_SECRET
      },
      body: JSON.stringify({ tenantId })
    })
    
    if (!response.ok) {
      throw new Error("Failed to logout WA session on gateway")
    }
    
    return { success: true }
  } catch (error) {
    console.error("[logoutWaSession]", error)
    return { error: "Gagal memutus sesi WhatsApp." }
  }
}

export async function sendWaMessageTest(tenantId: string, phone: string, message: string) {
  await requireTenantAccess(tenantId)
  
  try {
    const response = await fetch(`${WA_GATEWAY_URL}/api/wa/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": INTERNAL_SECRET
      },
      body: JSON.stringify({ tenantId, to: phone, text: message })
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      return { error: data.error || "Gagal mengirim pesan" }
    }
    
    return { success: true, data }
  } catch (error) {
    console.error("[sendWaMessageTest]", error)
    return { error: "Terjadi kesalahan saat mengirim pesan uji coba." }
  }
}
