import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Syarat & Ketentuan | SchoolPro",
  description: "Syarat dan ketentuan layanan serta panduan hukum penggunaan platform manajemen sekolah digital SchoolPro bagi seluruh institusi dan pengguna.",
}

export default function TermsAndConditionsPage() {
  return (
    <div className="bg-background min-h-screen pt-12 pb-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-4 text-foreground">Syarat & Ketentuan</h1>
        <p className="text-sm text-muted-foreground mb-10">Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        
        <div className="prose prose-slate max-w-none text-muted-foreground prose-headings:text-foreground prose-a:text-primary">
          <p>
            Selamat datang di SchoolPro. Dengan mengakses dan menggunakan layanan kami, Anda menyetujui untuk terikat oleh Syarat dan Ketentuan berikut. Silakan baca dengan saksama.
          </p>

          <h2>1. Penerimaan Syarat</h2>
          <p>
            Layanan SaaS (Software as a Service) SchoolPro disediakan oleh PT SchoolPro Teknologi Indonesia. Dengan mendaftarkan sekolah/lembaga Anda atau menggunakan sistem kami, Anda secara otomatis menyetujui seluruh ketentuan yang tertulis di halaman ini.
          </p>

          <h2>2. Deskripsi Layanan</h2>
          <p>
            SchoolPro menyediakan platform manajemen sekolah berbasis cloud yang mencakup pembuatan website instan, sistem Penerimaan Peserta Didik Baru (PPDB), manajemen data akademik, tagihan, dan fitur lain yang dapat diperbarui dari waktu ke waktu. 
          </p>

          <h2>3. Akun dan Keamanan</h2>
          <ul>
            <li>Anda bertanggung jawab menjaga kerahasiaan kata sandi akun lembaga Anda.</li>
            <li>Anda setuju untuk segera memberitahu tim dukungan SchoolPro jika ada penggunaan tanpa izin atas akun Anda.</li>
            <li>Segala aktivitas yang terjadi di bawah akun Anda sepenuhnya adalah tanggung jawab Anda sebagai pengelola/Tenant.</li>
          </ul>

          <h2>4. Privasi dan Perlindungan Data</h2>
          <p>
            Keamanan data siswa dan sekolah Anda adalah prioritas kami. Pengelolaan data pribadi yang Anda masukkan ke dalam sistem diatur sepenuhnya di dalam <a href="/kebijakan-privasi">Kebijakan Privasi</a> kami. Kami bertindak sebagai pemroses data, sedangkan Anda (sekolah) adalah pengontrol data.
          </p>

          <h2>5. Pembayaran dan Berlangganan</h2>
          <ul>
            <li>Beberapa fitur berbayar (seperti Paket Pro/Enterprise) mengharuskan Anda membayar biaya langganan bulanan atau tahunan.</li>
            <li>Semua transaksi ditagih sesuai dengan invoice yang diterbitkan. Fitur yang sudah dibeli tidak dapat di-refund secara sepihak kecuali ada kegagalan layanan dari sisi SchoolPro.</li>
            <li>Keterlambatan pembayaran langganan dapat menyebabkan penonaktifan sementara akses ke sistem manajemen atau website Anda.</li>
          </ul>

          <h2>6. Batasan Tanggung Jawab</h2>
          <p>
            SchoolPro terus berusaha memberikan sistem dengan *uptime* 99.9%. Namun, kami tidak bertanggung jawab atas kerugian finansial atau kehilangan data sekunder yang diakibatkan oleh *force majeure*, kegagalan server pihak ketiga, atau kesalahan kelalaian pengguna.
          </p>

          <h2>7. Perubahan Syarat dan Ketentuan</h2>
          <p>
            SchoolPro berhak untuk mengubah, memodifikasi, atau memperbarui Syarat & Ketentuan ini kapan saja. Perubahan yang signifikan akan diberitahukan melalui email terdaftar atau notifikasi di *Dashboard Admin*.
          </p>

          <h2>8. Hubungi Kami</h2>
          <p>
            Jika Anda memiliki pertanyaan mengenai Syarat & Ketentuan ini, silakan hubungi kami di:
          </p>
          <p>
            <strong>Email:</strong> support@schoolpro.id<br/>
            <strong>WhatsApp:</strong> +62 812-3456-7890
          </p>
        </div>
      </div>
    </div>
  )
}
