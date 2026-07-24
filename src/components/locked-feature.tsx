import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { PlanType } from "@/lib/subscription"

interface LockedFeatureProps {
  featureName: string;
  requiredPlan: PlanType;
}

export function LockedFeature({ featureName, requiredPlan }: LockedFeatureProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="max-w-md w-full text-center border-dashed border-2 shadow-sm">
        <CardHeader className="pb-4">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">Fitur Terkunci</CardTitle>
          <CardDescription className="text-base mt-2">
            Fitur <strong className="text-foreground">{featureName}</strong> hanya tersedia untuk perusahaan dengan paket berlangganan <strong>{requiredPlan.toUpperCase()}</strong> ke atas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Tingkatkan paket langganan Anda untuk membuka fitur ini dan fitur premium lainnya.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center pt-2 pb-8">
          <Link href="/admin/billing">
            <Button size="lg" className="font-semibold shadow-sm">
              Tingkatkan Paket (Upgrade)
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
