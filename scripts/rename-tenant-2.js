const fs = require('fs');
const glob = require('glob');

function processFiles(pattern) {
  const files = glob.sync(pattern);
  let changedFiles = 0;

  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    content = content.replace(/Daftar Tenant/gi, 'Daftar Lembaga');
    content = content.replace(/Manajemen Tenant/gi, 'Manajemen Lembaga');
    content = content.replace(/Profil Tenant/gi, 'Profil Lembaga');
    content = content.replace(/Domain Tenant/gi, 'Domain Lembaga');
    content = content.replace(/Tenant /g, 'Lembaga ');

    if (original !== content) {
      fs.writeFileSync(file, content);
      changedFiles++;
      console.log('Updated: ' + file);
    }
  });
  return changedFiles;
}

let total = 0;
total += processFiles('src/app/(dashboard)/admin/**/*.tsx');
total += processFiles('src/app/(dashboard)/panel-gtk/**/*.tsx');
console.log('Total changed: ' + total);
