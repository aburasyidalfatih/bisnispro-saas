"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { History, LayoutList, Settings2 } from "lucide-react"
import { AiPackagesList } from "./_components/ai-packages-list"
import { AiRatesManager } from "./_components/ai-rates-manager"
import { AiUsageHistory } from "./_components/ai-usage-history"

export default function AiPackagesPage() {
  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manajemen AI</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Kelola paket Token AI, tarif pemotongan per fitur, dan pantau histori penggunaannya.
        </p>
      </div>

      <Tabs defaultValue="paket" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="paket" className="gap-2">
            <LayoutList className="h-4 w-4" /> Paket Token
          </TabsTrigger>
          <TabsTrigger value="tarif" className="gap-2">
            <Settings2 className="h-4 w-4" /> Tarif Fix
          </TabsTrigger>
          <TabsTrigger value="histori" className="gap-2">
            <History className="h-4 w-4" /> Histori Penggunaan
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="paket" className="mt-0 focus-visible:outline-none focus-visible:ring-0 border-0">
          <AiPackagesList />
        </TabsContent>
        
        <TabsContent value="tarif" className="mt-0 focus-visible:outline-none focus-visible:ring-0 border-0">
          <AiRatesManager />
        </TabsContent>
        
        <TabsContent value="histori" className="mt-0 focus-visible:outline-none focus-visible:ring-0 border-0">
          <AiUsageHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
}
