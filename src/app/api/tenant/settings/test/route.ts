import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { parseBody } from "@/lib/api-utils"

const testSchema = z.object({
  type: z.enum(["smtp", "whatsapp", "meta_wa", "wavio"]),
  // SMTP fields
  smtpHost: z.string().optional(),
  smtpPort: z.number().optional(),
  smtpUser: z.string().optional(),
  smtpPass: z.string().optional(),
  smtpFrom: z.string().optional(),
  smtpTo: z.string().email("Email tujuan tidak valid").optional(),
  // WhatsApp fields
  waApiUrl: z.string().url("URL tidak valid").optional(),
  waApiKey: z.string().optional(),
  waDeviceId: z.string().optional(),
  waPhone: z.string().optional(),
  // Meta WA fields
  metaPhoneId: z.string().optional(),
  metaToken: z.string().optional(),
  // Wavio fields
  wavioApiKey: z.string().optional(),
  wavioNumberId: z.string().optional(),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = await parseBody(req, testSchema)
  if (parsed.error) return parsed.error
  const data = parsed.data

  // ==================== TEST SMTP ====================
  if (data.type === "smtp") {
    if (!data.smtpHost || !data.smtpUser || !data.smtpPass || !data.smtpTo) {
      return NextResponse.json(
        { error: "Lengkapi konfigurasi SMTP: Host, User, Password, dan Email Tujuan" },
        { status: 400 }
      )
    }
    try {
      // @ts-ignore
      const nodemailer = await import("nodemailer")
      const transporter = nodemailer.default.createTransport({
        host: data.smtpHost,
        port: data.smtpPort || 587,
        secure: (data.smtpPort || 587) === 465,
        auth: { user: data.smtpUser, pass: data.smtpPass },
      })
      await transporter.verify()
      await transporter.sendMail({
        from: data.smtpFrom || data.smtpUser,
        to: data.smtpTo,
        subject: "Test Email — SchoolPro",
        html: `<p>Email test berhasil dikirim dari konfigurasi SMTP.</p><p>Waktu: ${new Date().toLocaleString("id-ID")}</p>`,
      })
      return NextResponse.json({ message: "Email test berhasil dikirim!" })
    } catch (err: any) {
      return NextResponse.json({ error: `Koneksi SMTP gagal: ${err.message}` }, { status: 400 })
    }
  }

  // ==================== TEST WHATSAPP ====================
  if (data.type === "whatsapp") {
    if (!data.waApiUrl || !data.waApiKey || !data.waPhone) {
      return NextResponse.json(
        { error: "Lengkapi konfigurasi WhatsApp: URL API, API Key, dan Nomor Tujuan" },
        { status: 400 }
      )
    }
    try {
      const body: Record<string, string> = {
        messageType: "text",
        to: data.waPhone,
        body: `Test pesan dari SchoolPro. Waktu: ${new Date().toLocaleString("id-ID")}`,
      }
      // Sertakan deviceId jika tersedia
      if (data.waDeviceId) body.deviceId = data.waDeviceId

      const res = await fetch(`${data.waApiUrl}/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: data.waApiKey, // Tidak menggunakan Bearer untuk StarSender
        },
        body: JSON.stringify(body),
      })
      const result = await res.json()
      if (!res.ok) {
        return NextResponse.json(
          { error: `WhatsApp API error: ${result.message || res.statusText}` },
          { status: 400 }
        )
      }
      return NextResponse.json({ message: "Pesan WhatsApp test berhasil dikirim!" })
    } catch (err: any) {
      return NextResponse.json(
        { error: `Koneksi WhatsApp gagal: ${err.message}` },
        { status: 400 }
      )
    }
  }

  // ==================== TEST META WA ====================
  if (data.type === "meta_wa") {
    if (!data.metaPhoneId || !data.metaToken || !data.waPhone) {
      return NextResponse.json(
        { error: "Lengkapi konfigurasi Meta: Phone ID, Token, dan Nomor Tujuan" },
        { status: 400 }
      )
    }
    try {
      let toPhone = data.waPhone.replace(/\D/g, "")
      if (toPhone.startsWith("0")) {
        toPhone = "62" + toPhone.slice(1)
      }
      
      const res = await fetch(`https://graph.facebook.com/v18.0/${data.metaPhoneId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.metaToken}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: toPhone,
          type: "text",
          text: {
            body: `Test pesan Meta API dari SchoolPro. Waktu: ${new Date().toLocaleString("id-ID")}`
          }
        }),
      })
      const result = await res.json()
      if (!res.ok) {
        return NextResponse.json(
          { error: `Meta API error: ${result.error?.message || res.statusText}` },
          { status: 400 }
        )
      }
      return NextResponse.json({ message: "Pesan Meta test berhasil dikirim!" })
    } catch (err: any) {
      return NextResponse.json(
        { error: `Koneksi Meta API gagal: ${err.message}` },
        { status: 400 }
      )
    }
  }

  // ==================== TEST WAVIO ====================
  if (data.type === "wavio") {
    if (!data.wavioApiKey || !data.wavioNumberId || !data.waPhone) {
      return NextResponse.json(
        { error: "Lengkapi konfigurasi Wavio: API Key, Number ID, dan Nomor Tujuan" },
        { status: 400 }
      )
    }
    try {
      let toPhone = data.waPhone.replace(/\D/g, "")
      if (toPhone.startsWith("0")) {
        toPhone = "62" + toPhone.slice(1)
      }
      if (!toPhone.startsWith("+")) {
        toPhone = "+" + toPhone
      }
      
      const res = await fetch(`https://api.wavio.web.id/api/v1/public/messages/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": data.wavioApiKey,
        },
        body: JSON.stringify({
          numberId: data.wavioNumberId,
          to: toPhone,
          text: `Test pesan Wavio API dari SchoolPro. Waktu: ${new Date().toLocaleString("id-ID")}`
        }),
      })
      const result = await res.json()
      if (!res.ok || !result.success) {
        return NextResponse.json(
          { error: `Wavio API error: ${result.message || res.statusText}` },
          { status: 400 }
        )
      }
      return NextResponse.json({ message: "Pesan Wavio test berhasil dikirim!" })
    } catch (err: any) {
      return NextResponse.json(
        { error: `Koneksi Wavio API gagal: ${err.message}` },
        { status: 400 }
      )
    }
  }

  return NextResponse.json({ error: "Tipe test tidak valid" }, { status: 400 })
}
