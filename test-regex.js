const dummyOwnerName = "Bapak/Ibu Admin"
const dummySchoolName = "Sekolah Uji Coba SchoolPro"

const content = `Halo Bapak/Ibu Admin {{schoolName}},

Selamat! Anda telah mencapai hari terakhir dari rangkaian edukasi digital SchoolPro.

Satu tips terakhir yang sangat krusial: "Website yang tidak pernah di-update akan dianggap sebagai sekolah yang tutup atau tidak aktif."

Biasakan untuk menulis berita kegiatan atau mempublikasikan agenda akademik secara rutin. Ini menunjukkan transparansi dan keaktifan {{schoolName}} kepada publik. Jadikan website sekolah sebagai pusat informasi terpercaya!

👉 **Tulis artikel atau berita pertama Anda sekarang:**
https://schoolpro.id/super-admin/settings

Terima kasih telah bersama SchoolPro dalam memajukan digitalisasi pendidikan Indonesia!

Salam Hangat,
Tim SchoolPro Indonesia`

const content2 = content
  .replace(/{{name}}/g, dummyOwnerName)
  .replace(/{{schoolName}}/g, dummySchoolName)

const trackableContent = content2.replace(/(https?:\/\/[^\s<>'")]+)/g, (url) => {
  return `<a href="${url}" style="display:inline-block; margin-top:10px; margin-bottom:10px; padding:12px 24px; background-color:#2563eb; color:#ffffff; text-decoration:none; border-radius:6px; font-weight:600;">🔗 Buka Tautan</a><br/><span style="font-size:12px; color:#6b7280;">(${url})</span>`
})

const formattedContent = trackableContent.replace(/\n/g, '<br/>')

const htmlContent = `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
    <div style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); padding: 32px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">SchoolPro Edukasi</h1>
    </div>
    <div style="padding: 40px 32px; background-color: #ffffff; color: #374151; font-size: 16px; line-height: 1.7;">
      ${formattedContent}
    </div>
    <div style="background-color: #f3f4f6; padding: 24px; text-align: center; color: #6b7280; font-size: 13px; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0 0 8px 0;">Ini adalah email pengujian (Test Email) dari Dasbor SchoolPro.</p>
      <p style="margin: 0;">&copy; ${new Date().getFullYear()} SchoolPro Indonesia. All rights reserved.</p>
    </div>
  </div>
`

console.log(htmlContent)
