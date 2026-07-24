import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Kebijakan Privasi | BisnisPro",
  description: "Pelajari komitmen BisnisPro dalam menjaga kerahasiaan, keamanan, dan perlindungan data pribadi pengguna platform manajemen perusahaan kami.",
  alternates: {
    canonical: "/kebijakan-privasi",
  },
  openGraph: {
    title: "Kebijakan Privasi | BisnisPro",
    description: "Pelajari komitmen BisnisPro dalam menjaga kerahasiaan, keamanan, dan perlindungan data pribadi pengguna platform manajemen perusahaan kami.",
    url: "/kebijakan-privasi",
    images: ["/logo-bisnispro.png"],
  },
  twitter: {
    title: "Kebijakan Privasi | BisnisPro",
    description: "Pelajari komitmen BisnisPro dalam menjaga kerahasiaan, keamanan, dan perlindungan data pribadi pengguna platform manajemen perusahaan kami.",
  }
}

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-background min-h-screen pt-12 pb-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-4 text-foreground">Kebijakan Privasi</h1>
        <p className="text-sm text-muted-foreground mb-10">Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        
        <div className="prose prose-slate max-w-none text-muted-foreground prose-headings:text-foreground prose-a:text-primary">
          <p>
            Selamat datang di BisnisPro. Kami sangat menghargai privasi Anda dan berkomitmen untuk melindungi informasi pribadi dan data perusahaan Anda. Kebijakan privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi data Anda saat menggunakan platform SaaS BisnisPro.
          </p>

          <h2>1. Informasi yang Kami Kumpulkan</h2>
          <p>
            Kami mengumpulkan informasi dari Anda secara langsung ketika Anda mendaftarkan bisnis Anda, berlangganan layanan kami, menggunakan fitur platform, atau menghubungi tim dukungan kami. Informasi tersebut mencakup:
          </p>
          <ul>
            <li><strong>Informasi Akun & Bisnis:</strong> Nama lengkap, alamat email, nomor telepon, nama perusahaan, NPSN, dan dokumen legalitas perusahaan.</li>
            <li><strong>Informasi Pengguna Akhir (Klien, Staf, Orang Tua):</strong> Data akademik, presensi, keuangan (SPP), dan data kontak yang dimasukkan oleh pihak perusahaan.</li>
            <li><strong>Informasi Sistem & Penggunaan:</strong> Alamat IP, jenis browser, data log aktivitas, dan cookie.</li>
          </ul>

          <h2>2. Penggunaan Informasi</h2>
          <p>
            BisnisPro memproses data Anda untuk:
          </p>
          <ul>
            <li>Menyediakan, mengoperasikan, dan meningkatkan layanan platform manajemen perusahaan.</li>
            <li>Memproses transaksi pembayaran langganan.</li>
            <li>Mengirimkan notifikasi penting terkait layanan, keamanan, maupun notifikasi fungsional (seperti WhatsApp gateway).</li>
            <li>Mematuhi kewajiban hukum yang berlaku.</li>
          </ul>

          <h2>3. Keamanan Data</h2>
          <p>
            Kami menggunakan protokol keamanan berstandar industri (termasuk enkripsi data dan koneksi HTTPS yang aman) untuk mencegah akses tidak sah, kebocoran, atau perusakan data pengguna. Namun, kami mengingatkan bahwa tidak ada sistem elektronik yang 100% aman tanpa celah.
          </p>

          <h2>4. Pembagian Informasi ke Pihak Ketiga</h2>
          <p>
            Kami <strong>tidak akan pernah</strong> menjual data Anda kepada pihak ketiga. Kami hanya membagikan data kepada pihak ketiga dalam kondisi berikut:
          </p>
          <ul>
            <li><strong>Penyedia Layanan:</strong> Pihak yang membantu operasional kami, seperti Payment Gateway (Tripay) dan WhatsApp Gateway (Meta/StarSender), semata-mata untuk fungsi integrasi.</li>
            <li><strong>Kepatuhan Hukum:</strong> Jika diwajibkan oleh proses hukum atau untuk melindungi hak legal BisnisPro.</li>
          </ul>

          <h2>5. Penggunaan API Meta (WhatsApp)</h2>
          <p>
            Khusus untuk integrasi WhatsApp menggunakan API Resmi Meta, BisnisPro bertindak sebagai jembatan (Webhook/Gateway) untuk menyampaikan notifikasi. Kami mematuhi Kebijakan Privasi Meta. Pesan yang dikirim menggunakan enkripsi ujung ke ujung (E2EE) ketika telah sampai ke jaringan WhatsApp.
          </p>

          <h2>6. Hak Pengguna</h2>
          <p>
            Sebagai pengelola (Tenant), Anda memiliki hak penuh untuk menambah, mengedit, atau menghapus data perusahaan, staf, maupun klien dari sistem kami melalui Dashboard Admin.
          </p>

          <h2>7. Hubungi Kami</h2>
          <p>
            Jika Anda memiliki pertanyaan lebih lanjut mengenai kebijakan privasi ini atau pengelolaan data di platform kami, silakan hubungi kami di:
          </p>
          <p>
            <strong>Email:</strong> support@bisnispro.id<br/>
            <strong>WhatsApp:</strong> +62 812-3456-7890<br/>
            <strong>Alamat:</strong> Jl. Pendidikan No. 123, Jakarta, Indonesia
          </p>
        </div>
      </div>
    </div>
  )
}
