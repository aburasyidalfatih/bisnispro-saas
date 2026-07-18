const fs = require('fs');
const glob = require('glob');

function processFiles(pattern) {
  const files = glob.sync(pattern);
  let changedFiles = 0;

  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Safe UI replacements
    content = content.replace(/Tenant Aktif/g, 'Lembaga Aktif');
    content = content.replace(/Total Tenant/g, 'Total Lembaga');
    content = content.replace(/Data Tenant/g, 'Data Lembaga');
    content = content.replace(/Semua Tenant/g, 'Semua Lembaga');
    content = content.replace(/Tenant Baru/g, 'Lembaga Baru');
    content = content.replace(/Tenant Paling Aktif/g, 'Lembaga Paling Aktif');
    content = content.replace(/Tenant berbayar/g, 'Lembaga berbayar');
    content = content.replace(/Tenant Admin/g, 'Admin Lembaga');
    content = content.replace(/tenant admin/gi, 'admin lembaga');
    content = content.replace(/Retensi Tenant/g, 'Retensi Lembaga');
    content = content.replace(/Top 10 Tenant/g, 'Top 10 Lembaga');
    content = content.replace(/Skor Engagement Tenant/g, 'Skor Engagement Lembaga');
    content = content.replace(/Fitur yang Digunakan Tenant/g, 'Fitur yang Digunakan Lembaga');
    content = content.replace(/Insight Keuangan Tenant/g, 'Insight Keuangan Lembaga');
    content = content.replace(/>\s*Tenant\s*</g, '>Lembaga<');
    content = content.replace(/"Tenant"/g, '"Lembaga"');
    content = content.replace(/'Tenant'/g, "'Lembaga'");
    content = content.replace(/Pengaturan Tenant/gi, 'Pengaturan Lembaga');
    
    // Specific occurrences
    content = content.replace(/seluruh tenant/gi, 'seluruh lembaga');
    content = content.replace(/setiap tenant/gi, 'setiap lembaga');
    content = content.replace(/dari tenant/gi, 'dari lembaga');
    content = content.replace(/website tenant/gi, 'website lembaga');
    content = content.replace(/katalog tenant/gi, 'katalog lembaga');
    content = content.replace(/banyak tenant/gi, 'banyak lembaga');
    content = content.replace(/semua tenant/gi, 'semua lembaga');
    content = content.replace(/({ps\.count} )tenant/g, '$1lembaga');
    content = content.replace(/({data\.totalTenants} )tenant/g, '$1lembaga');
    content = content.replace(/Tenant LITE/g, 'Lembaga LITE');
    content = content.replace(/Tenant PRO/g, 'Lembaga PRO');
    content = content.replace(/Tenant FREE/g, 'Lembaga FREE');
    content = content.replace(/(\d+)\s+tenant/g, '$1 lembaga');
    content = content.replace(/Top 10 Lembaga Website Terbanyak Dikunjungi/g, 'Top 10 Website Lembaga Terbanyak Dikunjungi');

    if (original !== content) {
      fs.writeFileSync(file, content);
      changedFiles++;
      console.log('Updated: ' + file);
    }
  });
  return changedFiles;
}

let total = 0;
total += processFiles('src/app/(super-admin)/**/*.tsx');
total += processFiles('src/app/(dashboard)/admin/**/*.tsx');
console.log('Total changed: ' + total);
