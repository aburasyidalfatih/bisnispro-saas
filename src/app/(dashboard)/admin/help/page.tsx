"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Rocket, Sparkles, HelpCircle, Mail } from "lucide-react"

const helpItems = [
  { title: "Memulai", desc: "Panduan untuk pengguna baru", icon: Rocket },
  { title: "Fitur Utama", desc: "Pelajari fitur-fitur utama", icon: Sparkles },
  { title: "FAQ", desc: "Pertanyaan yang sering diajukan", icon: HelpCircle },
  { title: "Hubungi Kami", desc: "Butuh bantuan lebih lanjut?", icon: Mail },
]

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Panduan</h1>
        <p className="text-muted-foreground">Panduan penggunaan aplikasi</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {helpItems.map((item) => (
          <Card key={item.title} className="glass border-0 hover-lift cursor-pointer">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
