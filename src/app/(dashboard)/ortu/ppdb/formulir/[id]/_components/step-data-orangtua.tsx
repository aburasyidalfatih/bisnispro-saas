import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormField } from "./form-field"
import React from "react"

interface Props {
  dataOrangtua: any;
  setDataOrangtua: React.Dispatch<React.SetStateAction<any>>;
}

export function StepDataOrangtua({ dataOrangtua, setDataOrangtua }: Props) {
  return (
    <div className="space-y-8">
      {/* Ayah */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-5 w-5 rounded-full bg-blue-500/20 flex items-center justify-center text-[9px] font-bold text-blue-600">A</div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Data Ayah Kandung</p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <FormField label="Nama Ayah (Tanpa Gelar)" required>
            <Input placeholder="Nama lengkap sesuai KK" value={dataOrangtua.namaAyah} onChange={e => setDataOrangtua({...dataOrangtua, namaAyah: e.target.value})} className="rounded-xl" />
          </FormField>
          <FormField label="NIK Ayah" required>
            <Input placeholder="16 Digit NIK" value={dataOrangtua.nikAyah} onChange={e => setDataOrangtua({...dataOrangtua, nikAyah: e.target.value})} className="rounded-xl" maxLength={16} />
          </FormField>
          <FormField label="Tahun Lahir">
            <Input type="number" placeholder="Contoh: 1980" value={dataOrangtua.tahunLahirAyah} onChange={e => setDataOrangtua({...dataOrangtua, tahunLahirAyah: e.target.value})} className="rounded-xl" />
          </FormField>
          <FormField label="Pendidikan Terakhir">
            <Select value={dataOrangtua.pendidikanAyah} onValueChange={v => setDataOrangtua({...dataOrangtua, pendidikanAyah: v})}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih..." /></SelectTrigger>
              <SelectContent>
                {["Tidak Sekolah","Putus SD","SD Sederajat","SMP Sederajat","SMA Sederajat","D1-D3","D4/S1","S2","S3"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Pekerjaan">
            <Select value={dataOrangtua.pekerjaanAyah} onValueChange={v => setDataOrangtua({...dataOrangtua, pekerjaanAyah: v})}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih..." /></SelectTrigger>
              <SelectContent>
                {["Tidak Bekerja","Nelayan","Petani","Peternak","PNS/TNI/Polri","Karyawan Swasta","Pedagang Kecil","Pedagang Besar","Wiraswasta","Wirausaha","Buruh","Pensiunan","Lainnya"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Berkebutuhan Khusus">
            <Select value={dataOrangtua.kebutuhanKhususAyah} onValueChange={v => setDataOrangtua({...dataOrangtua, kebutuhanKhususAyah: v})}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih..." /></SelectTrigger>
              <SelectContent>
                {["Tidak","Tunanetra","Tunarungu","Tunagrahita","Tunadaksa","Lainnya"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="No. HP / WhatsApp Ayah">
            <Input placeholder="08xxxxxxxxxx" value={dataOrangtua.teleponAyah} onChange={e => setDataOrangtua({...dataOrangtua, teleponAyah: e.target.value})} className="rounded-xl" />
          </FormField>
        </div>
      </div>

      {/* Ibu */}
      <div className="pt-4 border-t border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-5 w-5 rounded-full bg-pink-500/20 flex items-center justify-center text-[9px] font-bold text-pink-600">I</div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Data Ibu Kandung</p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <FormField label="Nama Ibu (Tanpa Gelar)" required>
            <Input placeholder="Nama lengkap sesuai KK" value={dataOrangtua.namaIbu} onChange={e => setDataOrangtua({...dataOrangtua, namaIbu: e.target.value})} className="rounded-xl" />
          </FormField>
          <FormField label="NIK Ibu" required>
            <Input placeholder="16 Digit NIK" value={dataOrangtua.nikIbu} onChange={e => setDataOrangtua({...dataOrangtua, nikIbu: e.target.value})} className="rounded-xl" maxLength={16} />
          </FormField>
          <FormField label="Tahun Lahir">
            <Input type="number" placeholder="Contoh: 1982" value={dataOrangtua.tahunLahirIbu} onChange={e => setDataOrangtua({...dataOrangtua, tahunLahirIbu: e.target.value})} className="rounded-xl" />
          </FormField>
          <FormField label="Pendidikan Terakhir">
            <Select value={dataOrangtua.pendidikanIbu} onValueChange={v => setDataOrangtua({...dataOrangtua, pendidikanIbu: v})}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih..." /></SelectTrigger>
              <SelectContent>
                {["Tidak Sekolah","Putus SD","SD Sederajat","SMP Sederajat","SMA Sederajat","D1-D3","D4/S1","S2","S3"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Pekerjaan">
            <Select value={dataOrangtua.pekerjaanIbu} onValueChange={v => setDataOrangtua({...dataOrangtua, pekerjaanIbu: v})}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih..." /></SelectTrigger>
              <SelectContent>
                {["Tidak Bekerja","Ibu Rumah Tangga","PNS/TNI/Polri","Karyawan Swasta","Pedagang Kecil","Pedagang Besar","Wiraswasta","Wirausaha","Buruh","Pensiunan","Lainnya"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Berkebutuhan Khusus">
            <Select value={dataOrangtua.kebutuhanKhususIbu} onValueChange={v => setDataOrangtua({...dataOrangtua, kebutuhanKhususIbu: v})}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih..." /></SelectTrigger>
              <SelectContent>
                {["Tidak","Tunanetra","Tunarungu","Tunagrahita","Tunadaksa","Lainnya"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="No. HP / WhatsApp Ibu">
            <Input placeholder="08xxxxxxxxxx" value={dataOrangtua.teleponIbu} onChange={e => setDataOrangtua({...dataOrangtua, teleponIbu: e.target.value})} className="rounded-xl" />
          </FormField>
        </div>
      </div>

      {/* Wali */}
      <div className="pt-4 border-t border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-5 w-5 rounded-full bg-violet-500/20 flex items-center justify-center text-[9px] font-bold text-violet-600">W</div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Data Wali <span className="normal-case font-normal">(Kosongkan jika diisi oleh ayah/ibu)</span></p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <FormField label="Nama Wali">
            <Input placeholder="Nama wali sesuai KTP" value={dataOrangtua.namaWali} onChange={e => setDataOrangtua({...dataOrangtua, namaWali: e.target.value})} className="rounded-xl" />
          </FormField>
          <FormField label="NIK Wali">
            <Input placeholder="16 Digit NIK" value={dataOrangtua.nikWali} onChange={e => setDataOrangtua({...dataOrangtua, nikWali: e.target.value})} className="rounded-xl" maxLength={16} />
          </FormField>
          <FormField label="Tahun Lahir">
            <Input type="number" placeholder="Contoh: 1980" value={dataOrangtua.tahunLahirWali} onChange={e => setDataOrangtua({...dataOrangtua, tahunLahirWali: e.target.value})} className="rounded-xl" />
          </FormField>
          <FormField label="Hubungan Wali">
            <Input placeholder="Paman, Kakek, Kakak, dll" value={dataOrangtua.hubunganWali} onChange={e => setDataOrangtua({...dataOrangtua, hubunganWali: e.target.value})} className="rounded-xl" />
          </FormField>
          <FormField label="Pendidikan Terakhir">
            <Select value={dataOrangtua.pendidikanWali} onValueChange={v => setDataOrangtua({...dataOrangtua, pendidikanWali: v})}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih..." /></SelectTrigger>
              <SelectContent>
                {["Tidak Sekolah","Putus SD","SD Sederajat","SMP Sederajat","SMA Sederajat","D1-D3","D4/S1","S2","S3"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Pekerjaan">
            <Select value={dataOrangtua.pekerjaanWali} onValueChange={v => setDataOrangtua({...dataOrangtua, pekerjaanWali: v})}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih..." /></SelectTrigger>
              <SelectContent>
                {["Tidak Bekerja","Nelayan","Petani","Peternak","PNS/TNI/Polri","Karyawan Swasta","Wiraswasta","Wirausaha","Buruh","Pensiunan","Lainnya"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
        </div>
      </div>

      {/* Penghasilan */}
      <div className="pt-4 border-t border-border/50">
        <FormField label="Penghasilan Orang Tua/Wali Gabungan (Bulanan)">
          <Select value={dataOrangtua.penghasilanOrtuGabungan} onValueChange={v => setDataOrangtua({...dataOrangtua, penghasilanOrtuGabungan: v})}>
            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih range penghasilan..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Kurang dari Rp 500.000">Kurang dari Rp 500.000</SelectItem>
              <SelectItem value="Rp 500.000 - Rp 999.999">Rp 500.000 - Rp 999.999</SelectItem>
              <SelectItem value="Rp 1.000.000 - Rp 1.999.999">Rp 1.000.000 - Rp 1.999.999</SelectItem>
              <SelectItem value="Rp 2.000.000 - Rp 4.999.999">Rp 2.000.000 - Rp 4.999.999</SelectItem>
              <SelectItem value="Rp 5.000.000 - Rp 20.000.000">Rp 5.000.000 - Rp 20.000.000</SelectItem>
              <SelectItem value="Lebih dari Rp 20.000.000">Lebih dari Rp 20.000.000</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </div>
    </div>
  )
}
