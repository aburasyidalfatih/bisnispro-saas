"use client"

import { useState, useEffect } from "react"
import { CheckCircle, Send } from "lucide-react"

interface Props {
  slug: string
}

export function ContactForm({ slug }: Props) {
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
      <h2 className="text-xl font-bold mb-6">Kirim Pesan</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nama <span className="text-destructive">*</span></label>
            <input type="text" value={form.name} onChange={set("name")}
              placeholder="Nama lengkap Anda"
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email <span className="text-destructive">*</span></label>
            <input type="email" value={form.email} onChange={set("email")}
              placeholder="email@contoh.com"
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Nomor Telepon</label>
          <input type="tel" value={form.phone} onChange={set("phone")}
            placeholder="08xxxxxxxxxx (opsional)"
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Subjek</label>
          <input type="text" value={form.subject} onChange={set("subject")}
            placeholder="Perihal pesan Anda (opsional)"
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Pesan <span className="text-destructive">*</span></label>
          <textarea rows={5} value={form.message} onChange={set("message")}
            placeholder="Tulis pesan Anda di sini..."
            className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Berapa hasil dari {num1} + {num2}? <span className="text-destructive">*</span></label>
          <input type="number" value={captchaAnswer} onChange={e => setCaptchaAnswer(e.target.value)}
            placeholder="Jawaban"
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
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
          {sending ? "Mengirim..." : "Kirim Pesan"}
        </button>
      </form>
    </div>
  )
}
