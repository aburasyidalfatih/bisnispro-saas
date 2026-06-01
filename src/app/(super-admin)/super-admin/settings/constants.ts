export type SettingsForm = {
  // General
  app_logo: string;
  platform_name: string;
  platform_tagline: string;
  platform_address: string;
  allow_impersonate_user: string;
  enable_billing_upgrade: string;
  enable_custom_domain: string;
  block_search_indexing: string;
  contact_email: string;
  META_PIXEL_ID: string;
  AI_PROVIDER: string;
  OPENAI_API_KEY: string;
  OPENAI_MODEL: string;
  GEMINI_API_KEY: string;
  GEMINI_MODEL: string;
  OPENROUTER_API_KEY: string;
  OPENROUTER_MODEL: string;
  
  // Email
  SMTP_HOST: string;
  SMTP_PORT: string;
  SMTP_USER: string;
  SMTP_PASS: string;
  SMTP_FROM: string;
  
  // WhatsApp
  WA_ACTIVE_PROVIDER: string;
  META_WA_PHONE_NUMBER_ID: string;
  META_WA_BUSINESS_ACCOUNT_ID: string;
  META_WA_ACCESS_TOKEN: string;
  STARSENDER_API_KEY: string;
  STARSENDER_DEVICE_ID: string;
  STARSENDER_DELAY_MIN: string;
  STARSENDER_DELAY_MAX: string;
  WAVIO_API_KEY: string;
  WAVIO_NUMBER_ID: string;
  WA_SUBJECT_PENDING: string;
  WA_TEMPLATE_PENDING: string;
  WA_ENABLE_PENDING: string;
  EMAIL_ENABLE_PENDING: string;
  WA_SUBJECT_APPROVED: string;
  WA_TEMPLATE_APPROVED: string;
  WA_ENABLE_APPROVED: string;
  EMAIL_ENABLE_APPROVED: string;
  WA_SUBJECT_REVISION: string;
  WA_TEMPLATE_REVISION: string;
  WA_ENABLE_REVISION: string;
  EMAIL_ENABLE_REVISION: string;
  WA_SUBJECT_REJECTED: string;
  WA_TEMPLATE_REJECTED: string;
  WA_ENABLE_REJECTED: string;
  EMAIL_ENABLE_REJECTED: string;
  WA_TEMPLATE_ALERT_SUPERADMIN: string;
  WA_ENABLE_ALERT_SUPERADMIN: string;
  EMAIL_ENABLE_ALERT_SUPERADMIN: string;
  WA_TEMPLATE_ALERT_AFFILIATE: string;
  WA_ENABLE_ALERT_AFFILIATE: string;
  EMAIL_ENABLE_ALERT_AFFILIATE: string;
  WA_TEMPLATE_PAYMENT_SUCCESS_SUPERADMIN: string;
  WA_ENABLE_PAYMENT_SUCCESS_SUPERADMIN: string;
  EMAIL_ENABLE_PAYMENT_SUCCESS_SUPERADMIN: string;
  WA_TEMPLATE_WITHDRAWAL_REQUEST_SUPERADMIN: string;
  WA_ENABLE_WITHDRAWAL_REQUEST_SUPERADMIN: string;
  EMAIL_ENABLE_WITHDRAWAL_REQUEST_SUPERADMIN: string;
  WA_TEMPLATE_INVOICE_EXPIRED_SUPERADMIN: string;
  WA_ENABLE_INVOICE_EXPIRED_SUPERADMIN: string;
  EMAIL_ENABLE_INVOICE_EXPIRED_SUPERADMIN: string;

  // Billing Templates
  WA_TEMPLATE_INVOICE_CREATED: string;
  WA_ENABLE_INVOICE_CREATED: string;
  EMAIL_ENABLE_INVOICE_CREATED: string;
  WA_TEMPLATE_PAYMENT_CONFIRMED: string;
  WA_ENABLE_PAYMENT_CONFIRMED: string;
  EMAIL_ENABLE_PAYMENT_CONFIRMED: string;
  WA_TEMPLATE_AFFILIATE_COMMISSION: string;
  WA_ENABLE_AFFILIATE_COMMISSION: string;
  EMAIL_ENABLE_AFFILIATE_COMMISSION: string;
  WA_TEMPLATE_SUBSCRIPTION_REMINDER: string;
  WA_ENABLE_SUBSCRIPTION_REMINDER: string;
  EMAIL_ENABLE_SUBSCRIPTION_REMINDER: string;
  
  // Payment
  TRIPAY_API_KEY: string;
  TRIPAY_PRIVATE_KEY: string;
  TRIPAY_MERCHANT_CODE: string;
  TRIPAY_MODE: string;
  MANUAL_PAYMENT_BANK: string;
  MANUAL_PAYMENT_NUMBER: string;
  MANUAL_PAYMENT_NAME: string;
  MANUAL_PAYMENT_WA: string;

  // Google OAuth
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;

  // Google Indexing API
  GOOGLE_INDEXING_CLIENT_EMAIL: string;
  GOOGLE_INDEXING_PRIVATE_KEY: string;

  // Cloudflare Turnstile
  TURNSTILE_ENABLED: string;
  TURNSTILE_SITE_KEY: string;
  TURNSTILE_SECRET_KEY: string;

  // Pesan Retensi
  RETENTION_30_EMAIL_SUBJECT: string;
  RETENTION_30_EMAIL_BODY: string;
  RETENTION_30_WA: string;

  // Kendali Akses Free Plan
  FREE_PLAN_ACCESS: string;

  // Penyimpanan (Storage)
  STORAGE_PROVIDER: string;
  S3_ENDPOINT: string;
  S3_REGION: string;
  S3_ACCESS_KEY: string;
  S3_SECRET_KEY: string;
  S3_BUCKET: string;
  S3_PUBLIC_URL: string;
  
  // WA Support Landing Page
  SUPPORT_WA_NUMBERS: string;
};

export const DEFAULT_SETTINGS_FORM: SettingsForm = {
  // General
  app_logo: "",
  platform_name: "SchoolPro",
  platform_tagline: "Solusi Manajemen Sekolah Digital",
  platform_address: "",
  allow_impersonate_user: "true",
  enable_billing_upgrade: "false",
  enable_custom_domain: "false",
  block_search_indexing: "false",
  contact_email: "support@schoolpro.id",
  META_PIXEL_ID: "",
  AI_PROVIDER: "openai",
  OPENAI_API_KEY: "",
  OPENAI_MODEL: "gpt-4o-mini",
  GEMINI_API_KEY: "",
  GEMINI_MODEL: "gemini-1.5-flash",
  OPENROUTER_API_KEY: "",
  OPENROUTER_MODEL: "",
  
  // Email
  SMTP_HOST: "",
  SMTP_PORT: "587",
  SMTP_USER: "",
  SMTP_PASS: "",
  SMTP_FROM: "",
  
  // WhatsApp
  WA_ACTIVE_PROVIDER: "internal",
  META_WA_PHONE_NUMBER_ID: "",
  META_WA_BUSINESS_ACCOUNT_ID: "",
  META_WA_ACCESS_TOKEN: "",
  STARSENDER_API_KEY: "",
  STARSENDER_DEVICE_ID: "",
  STARSENDER_DELAY_MIN: "5",
  STARSENDER_DELAY_MAX: "15",
  WAVIO_API_KEY: "",
  WAVIO_NUMBER_ID: "",
  WA_SUBJECT_PENDING: "",
  WA_TEMPLATE_PENDING: `Halo {{adminName}},\n\nSelamat! Formulir pendaftaran sekolah {{schoolName}} telah kami terima dan saat ini sudah masuk ke dalam antrean peninjauan tim kami.\n\nKami akan segera menghubungi Anda kembali setelah proses verifikasi selesai.\n\nTerima kasih.`,
  WA_ENABLE_PENDING: "true",
  EMAIL_ENABLE_PENDING: "true",
  WA_SUBJECT_APPROVED: "",
  WA_TEMPLATE_APPROVED: `Halo {{adminName}},\n\nPendaftaran sekolah {{schoolName}} telah disetujui. Anda sekarang dapat mengakses dashboard sekolah menggunakan kredensial berikut:\n\nURL Login: {{loginUrl}}\nEmail: {{adminEmail}}\nPassword Sementara: {{tempPwd}}\n\n⚠️ PENTING: Harap segera mengganti password Anda setelah berhasil login pertama kali demi keamanan akun Anda.\n\nTerima kasih.`,
  WA_ENABLE_APPROVED: "true",
  EMAIL_ENABLE_APPROVED: "true",
  WA_SUBJECT_REVISION: "",
  WA_TEMPLATE_REVISION: `Halo {{adminName}},\n\nTerima kasih telah mendaftar. Namun, ada beberapa data yang perlu diperbaiki:\n\n"{{adminMessage}}"\n\nSilakan klik tautan berikut untuk melengkapi data pendaftaran Anda:\n{{revisionUrl}}\n\nTerima kasih.`,
  WA_ENABLE_REVISION: "true",
  EMAIL_ENABLE_REVISION: "true",
  WA_SUBJECT_REJECTED: "",
  WA_TEMPLATE_REJECTED: `Halo {{adminName}},\n\nMohon maaf, pendaftaran sekolah {{schoolName}} belum dapat kami setujui saat ini.\n\nAlasan: {{adminMessage}}\n\nTerima kasih atas minat Anda.`,
  WA_ENABLE_REJECTED: "true",
  EMAIL_ENABLE_REJECTED: "true",
  WA_TEMPLATE_ALERT_SUPERADMIN: `*PENDAFTARAN SEKOLAH BARU*\n\nSekolah: {{schoolName}}\nAdmin: {{adminName}}\nWA: {{adminPhone}}\nSubdomain: {{schoolSlug}}.schoolpro.id\n\nSilakan cek di Panel Super Admin untuk meninjau pengajuan ini.`,
  WA_ENABLE_ALERT_SUPERADMIN: "true",
  EMAIL_ENABLE_ALERT_SUPERADMIN: "true",
  WA_TEMPLATE_ALERT_AFFILIATE: `*LEAD SEKOLAH BARU! 🎉*\n\nHalo {{affiliateName}},\nKabar baik! Pendaftaran sekolah baru telah masuk menggunakan kode referral Anda ({{referralCode}}).\n\nSekolah: {{schoolName}}\nStatus: PENDING (Menunggu Review)\n\nSilakan pantau perkembangan lead Anda di Dashboard Mitra Afiliasi.`,
  WA_ENABLE_ALERT_AFFILIATE: "true",
  EMAIL_ENABLE_ALERT_AFFILIATE: "true",
  WA_TEMPLATE_PAYMENT_SUCCESS_SUPERADMIN: `*PEMBAYARAN BERHASIL! 💰*\n\nHore! Pembayaran sebesar Rp {{amount}} dari sekolah {{tenantName}} telah berhasil.\n\nTipe: {{invoiceType}}\nReference: {{reference}}\n\nSilakan cek dashboard untuk detail lebih lanjut.`,
  WA_ENABLE_PAYMENT_SUCCESS_SUPERADMIN: "true",
  EMAIL_ENABLE_PAYMENT_SUCCESS_SUPERADMIN: "true",
  WA_TEMPLATE_WITHDRAWAL_REQUEST_SUPERADMIN: `*🚨 PERMINTAAN PENARIKAN DANA BARU*\n\nAfiliasi: {{affiliateName}}\nJumlah: Rp {{amount}}\nBank: {{bankName}} - {{bankAccount}}\na.n: {{accountName}}\n\nSilakan proses pembayaran dan update status di Dashboard Super Admin.`,
  WA_ENABLE_WITHDRAWAL_REQUEST_SUPERADMIN: "true",
  EMAIL_ENABLE_WITHDRAWAL_REQUEST_SUPERADMIN: "true",
  WA_TEMPLATE_INVOICE_EXPIRED_SUPERADMIN: `*⚠️ INVOICE KEDALUWARSA*\n\nInvoice dari tenant {{tenantName}} telah kedaluwarsa dan gagal dibayar.\n\nReference: {{reference}}\nNominal: Rp {{amount}}\n\nMohon tim sales mem-follow up sekolah ini.`,
  WA_ENABLE_INVOICE_EXPIRED_SUPERADMIN: "true",
  EMAIL_ENABLE_INVOICE_EXPIRED_SUPERADMIN: "true",

  // Billing Templates
  WA_TEMPLATE_INVOICE_CREATED: `*Invoice {{invoiceType}} - SchoolPro*\n\nHalo,\n\nInvoice untuk {{invoiceType}} {{tenantName}} telah dibuat:\n\n📋 No. Invoice: {{reference}}\n💰 Total: Rp {{amount}}\n⏰ Batas Bayar: {{expiredAt}}\n\nSilakan transfer ke:\n🏦 {{bankName}}\n💳 {{bankNumber}}\n📛 a.n. {{bankAccountName}}\n\nSetelah transfer, hubungi admin via WA {{adminWA}} untuk konfirmasi.\n\nTerima kasih! 🙏`,
  WA_ENABLE_INVOICE_CREATED: "true",
  EMAIL_ENABLE_INVOICE_CREATED: "true",
  WA_TEMPLATE_PAYMENT_CONFIRMED: `*Pembayaran Dikonfirmasi ✅ - SchoolPro*\n\nHalo,\n\nPembayaran untuk {{tenantName}} telah dikonfirmasi!\n\n📋 No. Invoice: {{reference}}\n💰 Jumlah: Rp {{amount}}\n📦 Tipe: {{invoiceType}}\n👥 Kuota Siswa: {{studentQuota}}\n📅 Aktif Hingga: {{expiresAt}}\n\nSelamat menggunakan fitur premium! 🎉`,
  WA_ENABLE_PAYMENT_CONFIRMED: "true",
  EMAIL_ENABLE_PAYMENT_CONFIRMED: "true",
  WA_TEMPLATE_AFFILIATE_COMMISSION: `*Komisi Masuk! 💰 - SchoolPro*\n\nHalo {{affiliateName}},\n\nSelamat! Anda mendapat komisi dari referral:\n\n🏫 Sekolah: {{tenantName}}\n💰 Komisi: Rp {{commissionAmount}} (20%)\n💳 Saldo Saat Ini: Rp {{currentBalance}}\n\nTerima kasih sudah menjadi mitra SchoolPro! 🤝`,
  WA_ENABLE_AFFILIATE_COMMISSION: "true",
  EMAIL_ENABLE_AFFILIATE_COMMISSION: "true",
  WA_TEMPLATE_SUBSCRIPTION_REMINDER: `*{{urgency}} Pengingat Langganan - SchoolPro*\n\nHalo,\n\nLangganan PRO untuk {{tenantName}} akan berakhir dalam *{{daysRemaining}} hari* ({{expiresAt}}).\n\nSegera perpanjang langganan agar tidak kehilangan akses fitur premium.\n\nKunjungi: Menu Langganan di Dashboard Admin.`,
  WA_ENABLE_SUBSCRIPTION_REMINDER: "true",
  EMAIL_ENABLE_SUBSCRIPTION_REMINDER: "true",
  
  // Payment
  TRIPAY_API_KEY: "",
  TRIPAY_PRIVATE_KEY: "",
  TRIPAY_MERCHANT_CODE: "",
  TRIPAY_MODE: "sandbox",
  MANUAL_PAYMENT_BANK: "Bank BCA",
  MANUAL_PAYMENT_NUMBER: "1234 5678 90",
  MANUAL_PAYMENT_NAME: "PT SchoolPro Indonesia",
  MANUAL_PAYMENT_WA: "6281234567890",

  // Google OAuth
  GOOGLE_CLIENT_ID: "",
  GOOGLE_CLIENT_SECRET: "",

  // Google Indexing API
  GOOGLE_INDEXING_CLIENT_EMAIL: "",
  GOOGLE_INDEXING_PRIVATE_KEY: "",

  // Cloudflare Turnstile
  TURNSTILE_ENABLED: "false",
  TURNSTILE_SITE_KEY: "",
  TURNSTILE_SECRET_KEY: "",

  // Pesan Retensi
  RETENTION_30_EMAIL_SUBJECT: "Apakah ada kendala dengan website sekolah Anda?",
  RETENTION_30_EMAIL_BODY: "<p>Halo Admin {nama_sekolah},</p><p>Kami perhatikan Anda belum login ke dasbor SchoolPro selama 30 hari. Apakah ada kendala dalam mengatur website atau fitur sekolah Anda?</p><p>Yuk, mulai bangun kehadiran digital sekolah Anda sekarang. Jika butuh bantuan teknis, jangan sungkan membalas email ini!</p>",
  RETENTION_30_WA: "Halo Admin {nama_sekolah}, kami perhatikan Anda belum login dasbor selama 30 hari. Apakah ada kendala? Yuk, bangun kehadiran digital sekolah Anda sekarang. Balas pesan ini jika butuh bantuan!",

  // Kendali Akses Free Plan
  FREE_PLAN_ACCESS: JSON.stringify({
    enable_ppdb: false,
    enable_finance: false,
    enable_whatsapp: false,
    enable_custom_domain: false,
    enable_analytics: false,
    enable_parent_portal: false
  }),

  // Penyimpanan (Storage)
  STORAGE_PROVIDER: "local",
  S3_ENDPOINT: "https://<account_id>.r2.cloudflarestorage.com",
  S3_REGION: "auto",
  S3_ACCESS_KEY: "",
  S3_SECRET_KEY: "",
  S3_BUCKET: "",
  S3_PUBLIC_URL: "https://pub-<id>.r2.dev",
  
  // WA Support Landing Page
  SUPPORT_WA_NUMBERS: "[]",
};
