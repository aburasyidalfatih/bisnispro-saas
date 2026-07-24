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
  AI_AGENT_PROVIDER: string;
  AI_AGENT_MODEL: string;
  
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
  STARSENDER_KEYS_JSON: string;
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
  WA_TEMPLATE_WITHDRAWAL_APPROVED_AFFILIATE: string;
  WA_ENABLE_WITHDRAWAL_APPROVED_AFFILIATE: string;
  EMAIL_ENABLE_WITHDRAWAL_APPROVED_AFFILIATE: string;
  WA_TEMPLATE_WITHDRAWAL_REJECTED_AFFILIATE: string;
  WA_ENABLE_WITHDRAWAL_REJECTED_AFFILIATE: string;
  EMAIL_ENABLE_WITHDRAWAL_REJECTED_AFFILIATE: string;
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
  
  // Wavio Templates
  WAVIO_TEMPLATE_PENDING: string;
  WAVIO_TEMPLATE_APPROVED: string;
  WAVIO_TEMPLATE_REVISION: string;
  WAVIO_TEMPLATE_REJECTED: string;
  WAVIO_TEMPLATE_ALERT_SUPERADMIN: string;
  WAVIO_TEMPLATE_ALERT_AFFILIATE: string;
  WAVIO_TEMPLATE_WITHDRAWAL_APPROVED_AFFILIATE: string;
  WAVIO_TEMPLATE_WITHDRAWAL_REJECTED_AFFILIATE: string;
  WAVIO_TEMPLATE_PAYMENT_SUCCESS_SUPERADMIN: string;
  WAVIO_TEMPLATE_WITHDRAWAL_REQUEST_SUPERADMIN: string;
  WAVIO_TEMPLATE_INVOICE_EXPIRED_SUPERADMIN: string;
  WAVIO_TEMPLATE_INVOICE_CREATED: string;
  WAVIO_TEMPLATE_PAYMENT_CONFIRMED: string;
  WAVIO_TEMPLATE_AFFILIATE_COMMISSION: string;
  WAVIO_TEMPLATE_SUBSCRIPTION_REMINDER: string;
  
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

  // Google Contacts Sync
  GOOGLE_CONTACTS_CLIENT_ID: string;
  GOOGLE_CONTACTS_CLIENT_SECRET: string;
  GOOGLE_CONTACTS_REFRESH_TOKEN: string;

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
  RETENTION_60_EMAIL_SUBJECT: string;
  RETENTION_60_EMAIL_BODY: string;
  RETENTION_60_WA: string;
  RETENTION_90_EMAIL_SUBJECT: string;
  RETENTION_90_EMAIL_BODY: string;
  RETENTION_90_WA: string;

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

  // Afiliasi
  AFFILIATE_DEFAULT_CASHBACK_PERCENTAGE: string;
  AFFILIATE_COMMISSION_PERCENTAGE: string;
};

export const DEFAULT_SETTINGS_FORM: SettingsForm = {
  // General
  app_logo: "",
  platform_name: "BisnisPro",
  platform_tagline: "Solusi Manajemen Perusahaan Digital",
  platform_address: "",
  allow_impersonate_user: "true",
  enable_billing_upgrade: "false",
  enable_custom_domain: "false",
  block_search_indexing: "false",
  contact_email: "support@bisnispro.id",
  META_PIXEL_ID: "",
  AI_PROVIDER: "openai",
  OPENAI_API_KEY: "",
  OPENAI_MODEL: "gpt-4o-mini",
  GEMINI_API_KEY: "",
  GEMINI_MODEL: "gemini-1.5-flash",
  OPENROUTER_API_KEY: "",
  OPENROUTER_MODEL: "",
  AI_AGENT_PROVIDER: "openai",
  AI_AGENT_MODEL: "gpt-4o",
  
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
  STARSENDER_KEYS_JSON: "[]",
  STARSENDER_DELAY_MIN: "5",
  STARSENDER_DELAY_MAX: "15",
  WAVIO_API_KEY: "",
  WAVIO_NUMBER_ID: "",
  WA_SUBJECT_PENDING: "",
  WA_TEMPLATE_PENDING: `Halo {{adminName}},\n\nSelamat! Formulir pendaftaran perusahaan {{schoolName}} telah kami terima dan saat ini sudah masuk ke dalam antrean peninjauan tim kami.\n\nKami akan segera menghubungi Anda kembali setelah proses verifikasi selesai.\n\nTerima kasih.`,
  WA_ENABLE_PENDING: "true",
  EMAIL_ENABLE_PENDING: "true",
  WA_SUBJECT_APPROVED: "",
  WA_TEMPLATE_APPROVED: `Halo {{adminName}},\n\nPendaftaran perusahaan {{schoolName}} telah disetujui. Anda sekarang dapat mengakses dashboard perusahaan menggunakan kredensial berikut:\n\nURL Login: {{loginUrl}}\nEmail: {{adminEmail}}\nPassword Sementara: {{tempPwd}}\n\n⚠️ PENTING: Harap segera mengganti password Anda setelah berhasil login pertama kali demi keamanan akun Anda.\n\nJangan lupa bergabung di Grup Support WhatsApp BisnisPro untuk mendapatkan bantuan cepat dan update terbaru: https://chat.whatsapp.com/FtA3asfD4bcGpGyPXJgcg4\n\nTerima kasih.`,
  WA_ENABLE_APPROVED: "true",
  EMAIL_ENABLE_APPROVED: "true",
  WA_SUBJECT_REVISION: "",
  WA_TEMPLATE_REVISION: `Halo {{adminName}},\n\nTerima kasih telah mendaftar. Namun, ada beberapa data yang perlu diperbaiki:\n\n"{{adminMessage}}"\n\nSilakan klik tautan berikut untuk melengkapi data pendaftaran Anda:\n{{revisionUrl}}\n\nTerima kasih.`,
  WA_ENABLE_REVISION: "true",
  EMAIL_ENABLE_REVISION: "true",
  WA_SUBJECT_REJECTED: "",
  WA_TEMPLATE_REJECTED: `Halo {{adminName}},\n\nMohon maaf, pendaftaran perusahaan {{schoolName}} belum dapat kami setujui saat ini.\n\nAlasan: {{adminMessage}}\n\nTerima kasih atas minat Anda.`,
  WA_ENABLE_REJECTED: "true",
  EMAIL_ENABLE_REJECTED: "true",
  WA_TEMPLATE_ALERT_SUPERADMIN: `*PENDAFTARAN PERUSAHAAN BARU*\n\nPerusahaan: {{schoolName}}\nAdmin: {{adminName}}\nWA: {{adminPhone}}\nSubdomain: {{schoolSlug}}.bisnispro.id\n\nSilakan cek di Panel Super Admin untuk meninjau pengajuan ini.`,
  WA_ENABLE_ALERT_SUPERADMIN: "true",
  EMAIL_ENABLE_ALERT_SUPERADMIN: "true",
  WA_TEMPLATE_ALERT_AFFILIATE: `*LEAD PERUSAHAAN BARU! 🎉*\n\nHalo {{affiliateName}},\nKabar baik! Pendaftaran perusahaan baru telah masuk menggunakan kode referral Anda ({{referralCode}}).\n\nPerusahaan: {{schoolName}}\nStatus: PENDING (Menunggu Review)\n\nSilakan pantau perkembangan lead Anda di Dashboard Mitra Afiliasi.`,
  WA_ENABLE_ALERT_AFFILIATE: "true",
  EMAIL_ENABLE_ALERT_AFFILIATE: "true",
  WA_TEMPLATE_PAYMENT_SUCCESS_SUPERADMIN: `*PEMBAYARAN BERHASIL! 💰*\n\nHore! Pembayaran sebesar Rp {{amount}} dari perusahaan {{tenantName}} telah berhasil.\n\nTipe: {{invoiceType}}\nReference: {{reference}}\n\nSilakan cek dashboard untuk detail lebih lanjut.`,
  WA_ENABLE_PAYMENT_SUCCESS_SUPERADMIN: "true",
  EMAIL_ENABLE_PAYMENT_SUCCESS_SUPERADMIN: "true",
  WA_TEMPLATE_WITHDRAWAL_REQUEST_SUPERADMIN: `*🚨 PERMINTAAN PENARIKAN DANA BARU*\n\nAfiliasi: {{affiliateName}}\nJumlah: Rp {{amount}}\nBank: {{bankName}} - {{bankAccount}}\na.n: {{accountName}}\n\nSilakan proses pembayaran dan update status di Dashboard Super Admin.`,
  WA_ENABLE_WITHDRAWAL_REQUEST_SUPERADMIN: "true",
  EMAIL_ENABLE_WITHDRAWAL_REQUEST_SUPERADMIN: "true",
  WA_TEMPLATE_INVOICE_EXPIRED_SUPERADMIN: `*⚠️ INVOICE KEDALUWARSA*\n\nInvoice dari tenant {{tenantName}} telah kedaluwarsa dan gagal dibayar.\n\nReference: {{reference}}\nNominal: Rp {{amount}}\n\nMohon tim sales mem-follow up perusahaan ini.`,
  WA_ENABLE_INVOICE_EXPIRED_SUPERADMIN: "true",
  EMAIL_ENABLE_INVOICE_EXPIRED_SUPERADMIN: "true",
  WA_TEMPLATE_WITHDRAWAL_APPROVED_AFFILIATE: `*✅ Pencairan Dana Berhasil!*\n\nHalo {{affiliateName}},\nPermintaan pencairan dana afiliasi Anda telah disetujui.\n\n💰 Nominal: Rp {{amount}}\n🏦 Bank: {{bankName}}\n🔢 No. Rek: {{bankAccount}}\n👤 A.N: {{accountName}}`,
  WA_ENABLE_WITHDRAWAL_APPROVED_AFFILIATE: "true",
  EMAIL_ENABLE_WITHDRAWAL_APPROVED_AFFILIATE: "true",
  WA_TEMPLATE_WITHDRAWAL_REJECTED_AFFILIATE: `*❌ Pencairan Dana Ditolak*\n\nHalo {{affiliateName}},\nPermintaan pencairan dana sebesar Rp {{amount}} ditolak oleh admin.\n\nCatatan: {{notes}}\n\nDana telah dikembalikan ke saldo Anda.`,
  WA_ENABLE_WITHDRAWAL_REJECTED_AFFILIATE: "true",
  EMAIL_ENABLE_WITHDRAWAL_REJECTED_AFFILIATE: "true",

  // Billing Templates
  WA_TEMPLATE_INVOICE_CREATED: `*Invoice {{invoiceType}} - BisnisPro*\n\nHalo,\n\nInvoice untuk {{invoiceType}} {{tenantName}} telah dibuat:\n\n📋 No. Invoice: {{reference}}\n💰 Total: Rp {{amount}}\n⏰ Batas Bayar: {{expiredAt}}\n\nSilakan transfer ke:\n🏦 {{bankName}}\n💳 {{bankNumber}}\n📛 a.n. {{bankAccountName}}\n\nSetelah transfer, hubungi admin via WA {{adminWA}} untuk konfirmasi.\n\nTerima kasih! 🙏`,
  WA_ENABLE_INVOICE_CREATED: "true",
  EMAIL_ENABLE_INVOICE_CREATED: "true",
  WA_TEMPLATE_PAYMENT_CONFIRMED: `*Pembayaran Dikonfirmasi ✅ - BisnisPro*\n\nHalo,\n\nPembayaran untuk {{tenantName}} telah dikonfirmasi!\n\n📋 No. Invoice: {{reference}}\n💰 Jumlah: Rp {{amount}}\n📦 Tipe: {{invoiceType}}\n👥 Kuota Klien: {{studentQuota}}\n📅 Aktif Hingga: {{expiresAt}}\n\nSelamat menggunakan fitur premium! 🎉`,
  WA_ENABLE_PAYMENT_CONFIRMED: "true",
  EMAIL_ENABLE_PAYMENT_CONFIRMED: "true",
  WA_TEMPLATE_AFFILIATE_COMMISSION: `*Komisi Masuk! 💰 - BisnisPro*\n\nHalo {{affiliateName}},\n\nSelamat! Anda mendapat komisi dari referral:\n\n🏫 Perusahaan: {{tenantName}}\n💰 Komisi: Rp {{commissionAmount}}\n💳 Saldo Saat Ini: Rp {{currentBalance}}\n\nTerima kasih sudah menjadi mitra BisnisPro! 🤝`,
  WA_ENABLE_AFFILIATE_COMMISSION: "true",
  EMAIL_ENABLE_AFFILIATE_COMMISSION: "true",
  WA_TEMPLATE_SUBSCRIPTION_REMINDER: `*{{urgency}} Pengingat Langganan - BisnisPro*\n\nHalo,\n\nLangganan PRO untuk {{tenantName}} akan berakhir dalam *{{daysRemaining}} hari* ({{expiresAt}}).\n\nSegera perpanjang langganan agar tidak kehilangan akses fitur premium.\n\nKunjungi: Menu Langganan di Dashboard Admin.`,
  WA_ENABLE_SUBSCRIPTION_REMINDER: "true",
  EMAIL_ENABLE_SUBSCRIPTION_REMINDER: "true",
  
  // Wavio Templates
  WAVIO_TEMPLATE_PENDING: "school_registration_pending",
  WAVIO_TEMPLATE_APPROVED: "school_registration_approved",
  WAVIO_TEMPLATE_REVISION: "school_registration_revision",
  WAVIO_TEMPLATE_REJECTED: "school_registration_rejected",
  WAVIO_TEMPLATE_ALERT_SUPERADMIN: "superadmin_alert_new_school",
  WAVIO_TEMPLATE_ALERT_AFFILIATE: "affiliate_alert_new_lead",
  WAVIO_TEMPLATE_PAYMENT_SUCCESS_SUPERADMIN: "superadmin_alert_payment_success",
  WAVIO_TEMPLATE_WITHDRAWAL_REQUEST_SUPERADMIN: "superadmin_alert_withdrawal_request",
  WAVIO_TEMPLATE_INVOICE_EXPIRED_SUPERADMIN: "superadmin_alert_invoice_expired",
  WAVIO_TEMPLATE_INVOICE_CREATED: "billing_invoice_created",
  WAVIO_TEMPLATE_PAYMENT_CONFIRMED: "billing_payment_confirmed",
  WAVIO_TEMPLATE_AFFILIATE_COMMISSION: "billing_affiliate_commission",
  WAVIO_TEMPLATE_SUBSCRIPTION_REMINDER: "billing_subscription_reminder",
  WAVIO_TEMPLATE_WITHDRAWAL_APPROVED_AFFILIATE: "affiliate_withdrawal_approved",
  WAVIO_TEMPLATE_WITHDRAWAL_REJECTED_AFFILIATE: "affiliate_withdrawal_rejected",
  
  // Payment
  TRIPAY_API_KEY: "",
  TRIPAY_PRIVATE_KEY: "",
  TRIPAY_MERCHANT_CODE: "",
  TRIPAY_MODE: "sandbox",
  MANUAL_PAYMENT_BANK: "Bank BCA",
  MANUAL_PAYMENT_NUMBER: "1234 5678 90",
  MANUAL_PAYMENT_NAME: "PT BisnisPro Indonesia",
  MANUAL_PAYMENT_WA: "6281234567890",

  // Google OAuth
  GOOGLE_CLIENT_ID: "",
  GOOGLE_CLIENT_SECRET: "",

  // Google Contacts Sync
  GOOGLE_CONTACTS_CLIENT_ID: "",
  GOOGLE_CONTACTS_CLIENT_SECRET: "",
  GOOGLE_CONTACTS_REFRESH_TOKEN: "",

  // Google Indexing API
  GOOGLE_INDEXING_CLIENT_EMAIL: "",
  GOOGLE_INDEXING_PRIVATE_KEY: "",

  // Cloudflare Turnstile
  TURNSTILE_ENABLED: "false",
  TURNSTILE_SITE_KEY: "",
  TURNSTILE_SECRET_KEY: "",

  // Pesan Retensi
  RETENTION_30_EMAIL_SUBJECT: "Apakah ada kendala dengan website perusahaan Anda?",
  RETENTION_30_EMAIL_BODY: "<p>Halo Admin {nama_perusahaan},</p><p>Kami perhatikan Anda belum login ke dasbor BisnisPro selama 30 hari. Apakah ada kendala dalam mengatur website atau fitur perusahaan Anda?</p><p>Silakan login kembali menggunakan email pendaftaran Anda yaitu <strong>{email_pendaftaran}</strong> beserta password yang sudah Anda buat saat mendaftar. Jika Anda lupa password, silakan gunakan fitur \"Lupa Password\" di halaman login untuk membuat password baru.</p><p>Yuk, mulai bangun kehadiran digital perusahaan Anda sekarang. Jika butuh bantuan teknis, jangan sungkan membalas email ini!</p><p>Jangan lupa juga untuk bergabung di <strong>Grup Support WhatsApp BisnisPro</strong> untuk mendapatkan bantuan cepat dari tim kami dan update terbaru melalui tautan ini: <a href=\"https://chat.whatsapp.com/FtA3asfD4bcGpGyPXJgcg4\">https://chat.whatsapp.com/FtA3asfD4bcGpGyPXJgcg4</a></p>",
  RETENTION_30_WA: "Halo Admin {nama_perusahaan}, kami perhatikan Anda belum login dasbor selama 30 hari. Apakah ada kendala?\n\nSilakan login kembali menggunakan email pendaftaran Anda yaitu {email_pendaftaran} beserta password yang sudah Anda buat saat mendaftar. Jika lupa password, gunakan fitur Lupa Password di halaman login.\n\nYuk, bangun kehadiran digital perusahaan Anda sekarang. Balas pesan ini jika butuh bantuan!\n\nJangan lupa bergabung di Grup Support WhatsApp BisnisPro untuk mendapatkan bantuan cepat dan update terbaru: https://chat.whatsapp.com/FtA3asfD4bcGpGyPXJgcg4",
  RETENTION_60_EMAIL_SUBJECT: "PEMBERITAHUAN: Website Perusahaan Anda Ditangguhkan (Suspend)",
  RETENTION_60_EMAIL_BODY: "<p>Halo Admin {nama_perusahaan},</p><p>Kami ingin memberitahukan bahwa website perusahaan Anda saat ini telah <strong>ditangguhkan (suspend)</strong> karena tidak ada aktivitas login selama 60 hari terakhir.</p><p>Untuk mengaktifkan kembali website Anda, silakan segera menghubungi tim Admin BisnisPro. Jika tidak ada konfirmasi lebih lanjut, data website Anda akan dihapus secara permanen pada hari ke-90.</p><p>Jika Anda butuh bantuan, bergabunglah di <strong>Grup Support WhatsApp BisnisPro</strong>: <a href=\"https://chat.whatsapp.com/FtA3asfD4bcGpGyPXJgcg4\">https://chat.whatsapp.com/FtA3asfD4bcGpGyPXJgcg4</a></p>",
  RETENTION_60_WA: "Halo Admin {nama_perusahaan}, website perusahaan Anda saat ini berstatus SUSPEND (ditangguhkan) karena tidak ada aktivitas login selama 60 hari. Silakan hubungi admin BisnisPro jika ingin mengaktifkan kembali website Anda sebelum dihapus permanen.\n\nGrup Support WhatsApp BisnisPro: https://chat.whatsapp.com/FtA3asfD4bcGpGyPXJgcg4",
  RETENTION_90_EMAIL_SUBJECT: "PEMBERITAHUAN: Website Perusahaan Anda Telah Dihapus Permanen",
  RETENTION_90_EMAIL_BODY: "<p>Halo Admin {nama_perusahaan},</p><p>Karena tidak ada aktivitas login selama 90 hari dan masa penangguhan telah berakhir, dengan berat hati kami menginformasikan bahwa data website perusahaan Anda telah <strong>dihapus secara total</strong> dari sistem kami untuk menjaga performa server.</p><p>Jika di kemudian hari Anda ingin memiliki website kembali, silakan melakukan pengajuan pendaftaran ulang. Terima kasih atas ketertarikan Anda pada BisnisPro.</p><p>Tetap terhubung bersama kami di <strong>Grup Support WhatsApp BisnisPro</strong>: <a href=\"https://chat.whatsapp.com/FtA3asfD4bcGpGyPXJgcg4\">https://chat.whatsapp.com/FtA3asfD4bcGpGyPXJgcg4</a></p>",
  RETENTION_90_WA: "Halo Admin {nama_perusahaan}, website perusahaan Anda telah DIHAPUS TOTAL dari sistem karena tidak ada aktivitas selama 90 hari. Jika di kemudian hari Anda membutuhkan website kembali, silakan ajukan pendaftaran ulang. Terima kasih.\n\nGrup Support WhatsApp BisnisPro: https://chat.whatsapp.com/FtA3asfD4bcGpGyPXJgcg4",

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

  // Afiliasi
  AFFILIATE_DEFAULT_CASHBACK_PERCENTAGE: "20",
  AFFILIATE_COMMISSION_PERCENTAGE: "20",
};
