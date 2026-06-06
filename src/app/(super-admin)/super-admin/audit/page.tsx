"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GlobalAuditTab } from "./_components/global-audit-tab"
import { ErrorLogTab } from "./_components/error-log-tab"
import { FileText, Bug } from "lucide-react"

export default function GlobalAuditPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pusat Log & Audit</h1>
        <p className="text-muted-foreground mt-1">Pantau aktivitas platform dan error sistem dari satu tempat</p>
      </div>

      <Tabs defaultValue="audit" className="w-full">
        <TabsList className="w-full max-w-md grid grid-cols-2 mb-6 h-12">
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> Audit Log
          </TabsTrigger>
          <TabsTrigger value="errors" className="flex items-center gap-2">
            <Bug className="h-4 w-4" /> Error Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="mt-0 border-none p-0 outline-none">
          <GlobalAuditTab />
        </TabsContent>

        <TabsContent value="errors" className="mt-0 border-none p-0 outline-none">
          <ErrorLogTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
