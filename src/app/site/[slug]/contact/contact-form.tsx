"use client"

import { useState, useEffect } from "react"
import { CheckCircle, Send } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface Props {
  slug: string
  labels?: any
}

export function ContactForm({ slug, labels = {} }: Props) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  
  const [num1, setNum1] = useState(0)
  const [num2, setNum2] = useState(0)
  const [captchaAnswer, setCaptchaAnswer] = useState("")

  useEffect(() => {
    setNum1(Math.floor(Math.random() * 10) + 1)
    setNum2(Math.floor(Math.random() * 10) + 1)
  }, [])

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (sending) return
    setError("")

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Nama, email, dan pesan wajib diisi.")
      return
    }

    if (!captchaAnswer.trim()) {
      setError("Silakan jawab pertanyaan keamanan.")
      return
    }

    if (parseInt(captchaAnswer) !== num1 + num2) {
      setError("Jawaban matematika salah. Silakan coba lagi.")
      setNum1(Math.floor(Math.random() * 10) + 1)
      setNum2(Math.floor(Math.random() * 10) + 1)
      setCaptchaAnswer("")
      return
    }

    setSending(true)
    try {
      const res = await fetch(`/api/website/${slug}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        setSent(true)
        setForm({ name: "", email: "", phone: "", subject: "", message: "" })
        setCaptchaAnswer("")
      } else {
        setError(data.error || "Terjadi kesalahan. Coba lagi.")
      }
    } catch {
      setError("Tidak dapat terhubung ke server. Coba lagi.")
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border bg-background p-8 flex flex-col items-center justify-center text-center gap-4 min-h-[400px]">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle className="h-8 w-8 text-emerald-500" />
        </div>
        <div>
          <h3 className="text-xl font-bold">Pesan Terkirim!</h3>
          <p className="text-muted-foreground mt-2">
            Terima kasih telah menghubungi kami. Kami akan segera merespons pesan Anda.
          </p>
        </div>
        <button
          onClick={() => setSent(false)}
          className="text-sm text-primary hover:underline">
          Kirim pesan lain
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border bg-background p-8">
      <h2 className="text-xl font-bold mb-6">{labels.formTitle || "Kirim Pesan"}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="contact-name" className="text-sm font-medium">{labels.labelName || "Nama Lengkap"} <span className="text-destructive">*</span></label>
            <Input id="contact-name" type="text" value={form.name} onChange={set("name")}
              placeholder="Nama lengkap Anda" />
          </div>
          <div className="space-y-2">
            <label htmlFor="contact-email" className="text-sm font-medium">Email <span className="text-destructive">*</span></label>
            <Input id="contact-email" type="email" value={form.email} onChange={set("email")}
              placeholder="email@contoh.com" />
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="contact-phone" className="text-sm font-medium">Nomor Telepon</label>
          <Input id="contact-phone" type="tel" value={form.phone} onChange={set("phone")}
            placeholder="08xxxxxxxxxx (opsional)" />
        </div>
        <div className="space-y-2">
          <label htmlFor="contact-subject" className="text-sm font-medium">Subjek</label>
          <Input id="contact-subject" type="text" value={form.subject} onChange={set("subject")}
            placeholder="Perihal pesan Anda (opsional)" />
        </div>
        <div className="space-y-2">
          <label htmlFor="contact-message" className="text-sm font-medium">Pesan <span className="text-destructive">*</span></label>
          <Textarea id="contact-message" rows={5} value={form.message} onChange={set("message")}
            placeholder="Tulis pesan Anda di sini..." />
        </div>
        <div className="space-y-2">
          <label htmlFor="contact-captcha" className="text-sm font-medium">Berapa hasil dari {num1} + {num2}? <span className="text-destructive">*</span></label>
          <Input id="contact-captcha" type="number" value={captchaAnswer} onChange={e => setCaptchaAnswer(e.target.value)}
            placeholder="Jawaban" />
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3">{error}</p>
        )}

        <button type="submit" disabled={sending}
          className="w-full h-11 rounded-xl btn-gradient text-white font-medium flex items-center justify-center gap-2 disabled:opacity-70 px-4">
          {sending ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {sending ? "Mengirim..." : (labels.btnSubmit || "Kirim Pesan Sekarang")}
        </button>
      </form>
    </div>
  )
}
