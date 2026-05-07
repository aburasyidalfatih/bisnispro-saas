"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare, PenSquare } from "lucide-react"

export default function MyMessagesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pesan</h1>
          <p className="text-muted-foreground">Pesan dan komunikasi internal</p>
        </div>
        <Button className="gap-2">
          <PenSquare className="h-4 w-4" />
          Tulis Pesan
        </Button>
      </div>

      <Card className="glass border-0">
        <CardContent className="p-12 text-center">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">Belum ada pesan</p>
        </CardContent>
      </Card>
    </div>
  )
}
