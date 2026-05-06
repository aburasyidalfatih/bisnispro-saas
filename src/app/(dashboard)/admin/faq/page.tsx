"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HelpCircle } from "lucide-react"

const faqs = [
  {
    q: "Bagaimana cara mengubah password?",
    a: "Anda dapat mengubah password melalui menu Pengaturan > Keamanan. Masukkan password lama dan password baru Anda, lalu klik Simpan.",
  },
  {
    q: "Bagaimana cara menghubungi admin?",
    a: "Anda dapat menghubungi admin melalui menu Pesan atau melalui halaman Hubungi Kami di menu Panduan.",
  },
  {
    q: "Apakah data saya aman?",
    a: "Ya, kami menggunakan enkripsi end-to-end dan standar keamanan terbaik untuk melindungi semua data Anda.",
  },
  {
    q: "Bagaimana cara upload dokumen?",
    a: "Buka menu Dokumen Saya, lalu klik tombol Upload Dokumen di pojok kanan atas. Pilih file yang ingin Anda upload.",
  },
  {
    q: "Bagaimana cara melihat jadwal?",
    a: "Buka menu Jadwal untuk melihat jadwal mingguan Anda. Jadwal akan ditampilkan dalam tampilan kolom per hari.",
  },
]

export default function FaqPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <HelpCircle className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">FAQ</h1>
          <p className="text-muted-foreground">Pertanyaan yang sering diajukan</p>
        </div>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <Card key={i} className="glass border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{faq.q}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{faq.a}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
