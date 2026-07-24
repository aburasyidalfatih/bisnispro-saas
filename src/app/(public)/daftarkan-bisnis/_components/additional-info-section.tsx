import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function AdditionalInfoSection({
  form, setForm,
  isReferralLocked, setAffiliateName
}: any) {
  return (
    <Card className="glass border-0">
      <CardContent className="pt-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Jumlah Karyawan Saat Ini</Label>
            <div className="relative">
              <Input 
                required 
                type="number"
                min="1"
                value={form.employeeCount || ""} 
                onChange={(e) => setForm({...form, employeeCount: parseInt(e.target.value) || 0})}
                placeholder="Contoh: 500" 
                className="rounded-xl h-11"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Kode Referral Mitra (Opsional)</Label>
            <div className="relative">
              <Input 
                value={form.referralCode || ""} 
                readOnly={isReferralLocked}
                onChange={(e) => {
                  if (isReferralLocked) return;
                  
                  const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                  setForm({...form, referralCode: val});
                  
                  if (val.length >= 5) {
                    fetch(`/api/public/affiliate-info?ref=${val}`)
                      .then(res => res.json())
                      .then(data => {
                        if (data.name) setAffiliateName(data.name);
                        else setAffiliateName(null);
                      })
                      .catch(() => setAffiliateName(null));
                  } else {
                    setAffiliateName(null);
                  }
                }}
                placeholder="Masukkan kode mitra jika ada" 
                className={cn("rounded-xl h-11 uppercase", isReferralLocked && "bg-muted text-muted-foreground cursor-not-allowed")}
              />
              {isReferralLocked && (
                <div className="absolute right-3 top-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
              )}
            </div>
            {isReferralLocked && (
              <p className="text-xs text-muted-foreground">Kode referral telah terkunci dari link undangan.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
