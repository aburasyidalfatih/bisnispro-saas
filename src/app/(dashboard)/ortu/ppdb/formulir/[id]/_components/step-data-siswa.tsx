import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormField } from "./form-field"
import React from "react"

interface Props {
  dataSiswa: any;
  setDataSiswa: React.Dispatch<React.SetStateAction<any>>;
}

export function StepDataSiswa({ dataSiswa, setDataSiswa }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <FormField label="Jenis Pendaftaran" required>
          <Select value={dataSiswa.jenisPendaftaran} onValueChange={v => setDataSiswa({...dataSiswa, jenisPendaftaran: v})}>
            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Siswa Baru">Siswa Baru</SelectItem>
              <SelectItem value="Pindahan">Pindahan</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <div className="hidden md:block"></div>
        
        <FormField label="NISN" required>
          <Input placeholder="10 Digit NISN" value={dataSiswa.nisn} onChange={e => setDataSiswa({...dataSiswa, nisn: e.target.value})} className="rounded-xl" maxLength={10} />
        </FormField>
        <FormField label="NIK / No KTP" required>
          <Input placeholder="16 Digit NIK" value={dataSiswa.nik} onChange={e => setDataSiswa({...dataSiswa, nik: e.target.value})} className="rounded-xl" maxLength={16} />
        </FormField>
        
        <FormField label="No. Registrasi Akta Lahir">
          <Input placeholder="No. Akta Kelahiran" value={dataSiswa.noRegistrasiAkta} onChange={e => setDataSiswa({...dataSiswa, noRegistrasiAkta: e.target.value})} className="rounded-xl" />
        </FormField>
        <FormField label="Anak Ke-berapa (Berdasarkan KK)">
          <Input type="number" placeholder="Contoh: 1" value={dataSiswa.anakKe} onChange={e => setDataSiswa({...dataSiswa, anakKe: e.target.value})} className="rounded-xl" />
        </FormField>

        <FormField label="Jenis Kelamin" required>
          <Select value={dataSiswa.jenisKelamin} onValueChange={v => setDataSiswa({...dataSiswa, jenisKelamin: v})}>
            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Laki-laki">Laki-laki</SelectItem>
              <SelectItem value="Perempuan">Perempuan</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Agama">
          <Select value={dataSiswa.agama} onValueChange={v => setDataSiswa({...dataSiswa, agama: v})}>
            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih agama..." /></SelectTrigger>
            <SelectContent>
              {["Islam","Kristen","Katolik","Hindu","Buddha","Konghucu","Kepercayaan"].map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Tempat Lahir">
          <Input placeholder="Kota/Kab kelahiran" value={dataSiswa.tempatLahir} onChange={e => setDataSiswa({...dataSiswa, tempatLahir: e.target.value})} className="rounded-xl" />
        </FormField>
        <FormField label="Tanggal Lahir" required>
          <Input type="date" value={dataSiswa.tanggalLahir} onChange={e => setDataSiswa({...dataSiswa, tanggalLahir: e.target.value})} className="rounded-xl" />
        </FormField>

        <FormField label="Berkebutuhan Khusus">
          <Select value={dataSiswa.kebutuhanKhusus} onValueChange={v => setDataSiswa({...dataSiswa, kebutuhanKhusus: v})}>
            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih..." /></SelectTrigger>
            <SelectContent>
              {["Tidak","Tunanetra","Tunarungu","Tunagrahita","Tunadaksa","Lainnya"].map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Kewarganegaraan">
          <Select value={dataSiswa.kewarganegaraan} onValueChange={v => setDataSiswa({...dataSiswa, kewarganegaraan: v})}>
            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="WNI">WNI</SelectItem>
              <SelectItem value="WNA">WNA</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </div>

      <div className="pt-4 border-t border-border/50">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Alamat & Tempat Tinggal</p>
        <div className="space-y-4">
          <FormField label="Jalan / Nama Tempat Tinggal" required>
            <Input placeholder="Contoh: Jl. Merdeka No 1" value={dataSiswa.alamat} onChange={e => setDataSiswa({...dataSiswa, alamat: e.target.value})} className="rounded-xl" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="RT / RW">
              <Input placeholder="001/002" value={dataSiswa.rtRw} onChange={e => setDataSiswa({...dataSiswa, rtRw: e.target.value})} className="rounded-xl" />
            </FormField>
            <FormField label="Nama Dusun">
              <Input placeholder="Nama dusun/kampung" value={dataSiswa.dusun} onChange={e => setDataSiswa({...dataSiswa, dusun: e.target.value})} className="rounded-xl" />
            </FormField>
            <FormField label="Desa / Kelurahan">
              <Input placeholder="Desa/Kelurahan" value={dataSiswa.kelurahan} onChange={e => setDataSiswa({...dataSiswa, kelurahan: e.target.value})} className="rounded-xl" />
            </FormField>
            <FormField label="Kecamatan">
              <Input placeholder="Kecamatan" value={dataSiswa.kecamatan} onChange={e => setDataSiswa({...dataSiswa, kecamatan: e.target.value})} className="rounded-xl" />
            </FormField>
            <FormField label="Kabupaten / Kota">
              <Input placeholder="Kabupaten/Kota" value={dataSiswa.kabupaten} onChange={e => setDataSiswa({...dataSiswa, kabupaten: e.target.value})} className="rounded-xl" />
            </FormField>
            <FormField label="Provinsi">
              <Input placeholder="Provinsi" value={dataSiswa.provinsi} onChange={e => setDataSiswa({...dataSiswa, provinsi: e.target.value})} className="rounded-xl" />
            </FormField>
            <FormField label="Kode Pos">
              <Input placeholder="Kode Pos" value={dataSiswa.kodePos} onChange={e => setDataSiswa({...dataSiswa, kodePos: e.target.value})} className="rounded-xl" />
            </FormField>
            <div className="hidden md:block"></div>
            <FormField label="Lintang (Latitude)">
              <Input placeholder="Contoh: -6.12345" value={dataSiswa.lintang} onChange={e => setDataSiswa({...dataSiswa, lintang: e.target.value})} className="rounded-xl" />
            </FormField>
            <FormField label="Bujur (Longitude)">
              <Input placeholder="Contoh: 106.12345" value={dataSiswa.bujur} onChange={e => setDataSiswa({...dataSiswa, bujur: e.target.value})} className="rounded-xl" />
            </FormField>
            
            <FormField label="Tempat Tinggal">
              <Select value={dataSiswa.tempatTinggal} onValueChange={v => setDataSiswa({...dataSiswa, tempatTinggal: v})}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih..." /></SelectTrigger>
                <SelectContent>
                  {["Bersama Orang Tua","Wali","Kos","Asrama","Panti Asuhan","Lainnya"].map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Moda Transportasi">
              <Select value={dataSiswa.modaTransportasi} onValueChange={v => setDataSiswa({...dataSiswa, modaTransportasi: v})}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih..." /></SelectTrigger>
                <SelectContent>
                  {["Jalan Kaki","Kendaraan Pribadi","Kendaraan Umum/Angkot","Jemputan Sekolah","Kereta Api","Ojek","Lainnya"].map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-border/50 grid md:grid-cols-2 gap-4">
        <FormField label="No. HP / WhatsApp Siswa">
          <Input placeholder="08xxxxxxxxxx" value={dataSiswa.telepon} onChange={e => setDataSiswa({...dataSiswa, telepon: e.target.value})} className="rounded-xl" />
        </FormField>
        <FormField label="Email Pribadi">
          <Input type="email" placeholder="siswa@email.com" value={dataSiswa.emailPribadi} onChange={e => setDataSiswa({...dataSiswa, emailPribadi: e.target.value})} className="rounded-xl" />
        </FormField>
        <FormField label="Tinggi Badan (cm)">
          <Input type="number" placeholder="160" value={dataSiswa.tinggiBadan} onChange={e => setDataSiswa({...dataSiswa, tinggiBadan: e.target.value})} className="rounded-xl" />
        </FormField>
        <FormField label="Berat Badan (kg)">
          <Input type="number" placeholder="50" value={dataSiswa.beratBadan} onChange={e => setDataSiswa({...dataSiswa, beratBadan: e.target.value})} className="rounded-xl" />
        </FormField>
      </div>
    </div>
  )
}
