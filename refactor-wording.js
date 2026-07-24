const fs = require('fs');
const path = require('path');

const DIRECTORIES = ['src', 'prisma'];
const EXTENSIONS = ['.ts', '.tsx', '.prisma', '.md', '.json'];

// Define replacements (order matters!)
const REPLACEMENTS = [
  // Brand name
  { from: /SchoolPro/g, to: 'BisnisPro' },
  { from: /schoolpro\.id/g, to: 'bisnispro.id' },
  { from: /schoolpro/g, to: 'bisnispro' },
  { from: /SCHOOLPRO/g, to: 'BISNISPRO' },

  // Terminology - Case sensitive and word boundary to avoid breaking substrings where possible
  // Using \b for word boundaries, but also accommodating camelCase/PascalCase if needed
  
  // Sekolah
  { from: /Sekolah/g, to: 'Perusahaan' },
  { from: /sekolah/g, to: 'perusahaan' },
  { from: /SEKOLAH/g, to: 'PERUSAHAAN' },

  // Lembaga
  { from: /Lembaga/g, to: 'Bisnis' },
  { from: /lembaga/g, to: 'bisnis' },
  
  // Siswa
  { from: /Siswa/g, to: 'Klien' },
  { from: /siswa/g, to: 'klien' },

  // Guru (might conflict with Blog Guru, but we want "Blog Staf" anyway)
  { from: /Guru/g, to: 'Staf' },
  { from: /guru/g, to: 'staf' },

  // Kelas
  { from: /Kelas/g, to: 'Divisi' },
  { from: /kelas/g, to: 'divisi' },
  
  // Ekstrakurikuler (already removed mostly, but just in case)
  { from: /Ekstrakurikuler/g, to: 'Fasilitas Ekstra' },
  { from: /ekstrakurikuler/g, to: 'fasilitas ekstra' },

  // Alumni
  { from: /Alumni/g, to: 'Mitra' },
  { from: /alumni/g, to: 'mitra' },

  // Fasilitas
  { from: /Fasilitas/g, to: 'Aset' },
  { from: /fasilitas/g, to: 'aset' }
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;

  for (const { from, to } of REPLACEMENTS) {
    content = content.replace(from, to);
  }

  // Edge cases fixes (Lucide icons imports might be broken, e.g., GraduationCap, School, etc.)
  // If 'School' was in Lucide React, it doesn't match 'Sekolah' anyway because 'School' is English.
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  }
  return false;
}

function traverseDir(dir) {
  let changedFilesCount = 0;
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      changedFilesCount += traverseDir(fullPath);
    } else {
      const ext = path.extname(fullPath);
      if (EXTENSIONS.includes(ext)) {
        if (processFile(fullPath)) {
          changedFilesCount++;
          console.log(`Updated: ${fullPath}`);
        }
      }
    }
  }
  return changedFilesCount;
}

console.log("Starting massive text replacement...");
let totalChanged = 0;
for (const dir of DIRECTORIES) {
  const fullDirPath = path.join(__dirname, dir);
  if (fs.existsSync(fullDirPath)) {
    totalChanged += traverseDir(fullDirPath);
  }
}
console.log(`\nReplacement complete! Modified ${totalChanged} files.`);
