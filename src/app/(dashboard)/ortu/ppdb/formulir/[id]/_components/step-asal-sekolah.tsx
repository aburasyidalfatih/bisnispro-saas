import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle } from "lucide-react"
import { FormField } from "./form-field"
import React from "react"

interface Props {
  dataSekolah: any;
  setDataSekolah: React.Dispatch<React.SetStateAction<any>>;
}

export function StepAsalSekolah({ dataSekolah, setDataSekolah }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <FormField label="Nama Sekolah Asal">
          <Input placeholder="SDN / MIN / SMP Contoh" value={dataSekolah.namaSekolahAsal} onChange={e => setDataSekolah({...dataSekolah, namaSekolahAsal: e.target.value})} className="rounded-xl" />
        </FormField>
        <FormField label="NPSN Sekolah Asal">
          <Input placeholder="8 Digit Angka NPSN" value={dataSekolah.npsnSekolahAsal} onChange={e => setDataSekolah({...dataSekolah, npsnSekolahAsal: e.target.value})} className="rounded-xl" />
        </FormField>
      </div>
      <FormField label="Alamat Sekolah Asal">
        <Textarea placeholder="Alamat lengkap sekolah asal..." value={dataSekolah.alamatSekolahAsal} onChange={e => setDataSekolah({...dataSekolah, alamatSekolahAsal: e.target.value})} className="rounded-xl resize-none" rows={2} />
      </FormField>

      <div className="pt-4 border-t border-border/50 grid md:grid-cols-2 gap-4">
        <FormField label="Nomor Peserta Ujian Nasional (Jika ada)">
          <Input placeholder="20 digit nomor seri" value={dataSekolah.nomorPesertaUjian} onChange={e => setDataSekolah({...dataSekolah, nomorPesertaUjian: e.target.value})} className="rounded-xl" />
        </FormField>
        <FormField label="Nomor Seri Ijazah (Jika ada)">
          <Input placeholder="DN-01/D-SD/13/..." value={dataSekolah.nomorIjazah} onChange={e => setDataSekolah({...dataSekolah, nomorIjazah: e.target.value})} className="rounded-xl" />
        </FormField>
        <FormField label="Nomor SKHUN (Jika ada)">
          <Input placeholder="SKHUN" value={dataSekolah.nomorSKHUN} onChange={e => setDataSekolah({...dataSekolah, nomorSKHUN: e.target.value})} className="rounded-xl" />
        </FormField>
      </div>

      {/* Summary sebelum submit */}
      <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Siap Disimpan</p>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Pastikan semua data yang Anda isi sudah benar. Setelah menyimpan, Anda akan lanjut ke tahap <b>Upload Berkas</b>.
        </p>
      </div>
    </div>
  )
}
