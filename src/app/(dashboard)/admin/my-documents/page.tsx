"use client"

import { Card, CardContent } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { FolderOpen, Upload } from"lucide-react"
import { EmptyState } from "@/components/ui/empty-state"

export default function MyDocumentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dokumen Saya</h1>
          <p className="text-muted-foreground">Kelola dokumen dan file Anda</p>
        </div>
        <Button className="gap-2">
          <Upload className="h-4 w-4" />
          Upload Dokumen
        </Button>
      </div>

      <Card className="glass border-0">
        <CardContent className="p-12 text-center">
          <EmptyState
            icon={FolderOpen}
            title="Belum Ada Dokumen"
            description="Belum ada dokumen"
          />
        </CardContent>
      </Card>
    </div>
  )
}
