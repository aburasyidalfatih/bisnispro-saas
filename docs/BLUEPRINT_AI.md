# Blueprint Implementasi AI - SchoolPro SaaS
*Dokumen Master Rencana Induk & Panduan Teknis Pengembangan Fitur Kecerdasan Buatan*

---

## 1. Arsitektur Infrastruktur AI (Fondasi Saat Ini)
SchoolPro menggunakan pendekatan **Hybrid AI Enterprise Architecture**, di mana sekolah dapat menggunakan layanan AI dengan dua skema biaya: berlangganan kuota dari platform, atau membawa *API Key* mereka sendiri (BYOK).

### 1.1 Hierarki API Key (Fallback System)
Sistem memproses *request* ke OpenAI dengan urutan prioritas berikut:
1. **Kunci Kustom Sekolah (BYOK):** Sistem mengecek tabel `Tenant` apakah `useCustomApiKey` bernilai `true`. Jika ada, *request* dijalankan menggunakan `customOpenAiKey` tanpa memotong saldo token sekolah.
2. **Master Key Super Admin:** Jika BYOK tidak ada, sistem akan membaca `OPENAI_API_KEY` dari tabel `PlatformSetting` yang dikonfigurasi secara global oleh Super Admin. Proses ini **akan memotong saldo Token AI (`aiTokens`)** milik sekolah.
3. **Environment Variable (ENV):** Sebagai *fallback* terakhir tingkat server jika Master Key di database belum disetel.

### 1.2 Mekanisme *Billing* & Transparansi
*   **Top-Up Mandiri:** Sekolah dapat membeli paket token (contoh: 5k, 10k, 50k token) melalui modul *Billing*.
*   **Log Audit (`AiUsageLog`):** Setiap *request* yang berhasil akan memicu pencatatan ke database: siapa *user*-nya, apa fiturnya (contoh: `QUESTION_GENERATOR`), dan berapa token yang dihabiskan. Ini ditampilkan di **Riwayat Penggunaan AI**.

---

## 2. Peta Jalan Pengembangan AI (Roadmap)

### Fase 1: Fondasi & Evaluasi Akademik (✅ SELESAI)
*   **Infrastruktur AI Core:** Token Management, BYOK, Settings UI.
*   **CBT Question Generator:** Otomatisasi pembuatan puluhan soal pilihan ganda dari satu *prompt* menggunakan Vercel AI SDK (`generateObject`).

### Fase 2: Produktivitas Guru Terpadu (⏳ RENCANA SELANJUTNYA)
*   **AI Lesson Planner (Modul Ajar / RPP):** 
    *   *Cara Kerja:* Guru memasukkan Mata Pelajaran, Fase/Kelas, dan Materi Pokok. AI mengembalikan JSON berupa Tujuan Pembelajaran, Kegiatan Inti, hingga Asesmen sesuai format Kurikulum Merdeka.
*   **AI Grading Assistant (Koreksi Otomatis):**
    *   *Cara Kerja:* Untuk tipe soal Esai, AI membandingkan jawaban siswa dengan *Rubrik Penilaian* milik guru, lalu menghasilkan skor (0-100) beserta umpan balik (*feedback*) konstruktif.

### Fase 3: Otomatisasi Administrasi & PPDB (⏳ RENCANA SELANJUTNYA)
*   **Smart OCR PPDB:**
    *   *Cara Kerja:* Menggunakan AI Vision (contoh: `gpt-4o`). Calon siswa mengunggah foto KK, AI akan membaca NIK, Nama Lengkap, dan Tanggal Lahir lalu mengisi *form* registrasi PPDB secara otomatis.
*   **WhatsApp AI Chatbot:**
    *   *Cara Kerja:* Menerapkan *Retrieval-Augmented Generation (RAG)*. Dokumen sekolah (biaya, jadwal, lokasi) di-indeks menjadi vektor. Saat wali murid bertanya ke WhatsApp StarSender, AI akan merangkai jawaban berdasar dokumen tersebut dengan nada ramah.

### Fase 4: Analisis Eksekutif & Asisten Belajar (⏳ JANGKA PANJANG)
*   **Early Warning System (EWS):** Menganalisis nilai, presensi, dan log bimbingan (BK) untuk menandai siswa berisiko *drop-out* atau tinggal kelas.
*   **Tutor Siswa Pribadi:** Fitur *chat* di dasbor siswa yang diinstruksikan ketat (*system prompt*) untuk bertindak sebagai pembimbing yang memberikan *hint* rumus, **bukan** pemberi jawaban akhir.

---

## 3. Pedoman Teknis Pengembangan (Developer Guide)

Setiap kali *developer* ingin menambahkan fitur AI baru di SchoolPro, ikuti *Standar Operasional Prosedur* (SOP) berikut:

### Langkah 1: Validasi Kuota Token
Gunakan fungsi `checkAiTokenBalance` sebelum memanggil OpenAI untuk menghindari tagihan server bocor.
```typescript
import { checkAiTokenBalance } from "@/lib/services/ai-service"

const hasTokens = await checkAiTokenBalance(tenantId)
if (!hasTokens) throw new Error("Saldo Token AI habis.")
```

### Langkah 2: Inisialisasi Provider AI
Panggil `getAiProvider` agar hierarki BYOK vs Master Key berjalan otomatis. Jangan memanggil instance OpenAI secara statis.
```typescript
import { getAiProvider } from "@/lib/services/ai-service"

const openai = await getAiProvider(tenantId)
const model = openai("gpt-4o-mini") // Selalu gunakan model efisien biaya
```

### Langkah 3: Eksekusi AI & Pemotongan Token
Jika menggunakan *Structured Output* (untuk masuk ke tabel database), gunakan `generateObject` dengan *Zod Schema*. Setelah berhasil, wajib potong token menggunakan `deductAiToken`.
```typescript
import { deductAiToken } from "@/lib/services/ai-service"
import { generateObject } from "ai"
import { z } from "zod"

const { object } = await generateObject({
  model,
  schema: z.object({ /* schema */ }),
  prompt: "..."
})

// Catat audit dan potong token (contoh pemotongan estimasi cost)
await deductAiToken(tenantId, estimatedTokenCount, session.user.id, "NEW_FEATURE_NAME")
```

---
*SchoolPro AI Blueprint - Disusun oleh DeepMind Agentic Assistant*
