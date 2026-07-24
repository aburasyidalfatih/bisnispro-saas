const fs = require('fs');
const path = require('path');

const siteDir = 'c:/grafity project/bisnispro/src/app/site/[slug]';
const componentsDir = path.join(siteDir, '_components');
const themesDir = path.join(siteDir, '_themes');

// File renames map
const renames = {
  'programs-section.tsx': 'services-section.tsx',
  'achievements-section.tsx': 'portfolio-section.tsx',
  'alumni-testimonials.tsx': 'client-testimonials.tsx',
  'staff-highlight.tsx': 'team-highlight.tsx',
  'facilities-section.tsx': 'offices-section.tsx',
  'principal-welcome.tsx': 'founder-welcome.tsx',
  'info-board.tsx': 'latest-updates.tsx',
};

// Replace map for all files
const globalReplacements = [
  // Imports / Exports Component Names
  ['ProgramsSection', 'ServicesSection'],
  ['AchievementsSection', 'PortfolioSection'],
  ['AlumniTestimonials', 'ClientTestimonials'],
  ['StaffHighlight', 'TeamHighlight'],
  ['FacilitiesSection', 'OfficesSection'],
  ['PrincipalWelcome', 'FounderWelcome'],
  ['InfoBoard', 'LatestUpdates'],
  
  // Props Interfaces
  ['ProgramsSectionProps', 'ServicesSectionProps'],
  ['AchievementsSectionProps', 'PortfolioSectionProps'],
  ['AlumniTestimonialsProps', 'ClientTestimonialsProps'],
  ['StaffHighlightProps', 'TeamHighlightProps'],
  ['FacilitiesSectionProps', 'OfficesSectionProps'],
  ['PrincipalWelcomeProps', 'FounderWelcomeProps'],
  ['InfoBoardProps', 'LatestUpdatesProps'],

  // Types from _themes/types.ts
  ['PublicProgram', 'PublicService'],
  ['PublicAchievement', 'PublicPortfolio'],
  ['PublicAlumni', 'PublicClient'],
  ['PublicStaff', 'PublicTeamMember'],
  ['PublicFacility', 'PublicOffice'],
  
  // Domain Terms - School to Business
  ['Program Keahlian Kami', 'Layanan Kami'],
  ['Program Keahlian', 'Layanan'],
  ['program keahlian', 'layanan'],
  ['Prestasi Membanggakan', 'Portofolio Terbaik'],
  ['Prestasi', 'Portofolio'],
  ['prestasi', 'portofolio'],
  ['Alumni', 'Klien'],
  ['alumni', 'klien'],
  ['Guru & Tenaga Kependidikan', 'Tim Profesional Kami'],
  ['Tenaga Pendidik', 'Tim Profesional'],
  ['Guru/Staff', 'Tim Kami'],
  ['Guru', 'Tim'],
  ['Kepala Sekolah', 'Founder/CEO'],
  ['Fasilitas Sekolah', 'Kantor & Lokasi'],
  ['Fasilitas', 'Kantor/Lokasi'],
  ['fasilitas', 'kantor'],
  ['siswa', 'klien'],
  ['Siswa', 'Klien'],
  ['Sekolah', 'Perusahaan'],
  ['sekolah', 'perusahaan'],
  ['lulusan', 'proyek selesai'],
  ['Lulusan', 'Proyek Selesai'],
  ['peserta didik', 'pelanggan'],

  // File paths in imports
  ['programs-section', 'services-section'],
  ['achievements-section', 'portfolio-section'],
  ['alumni-testimonials', 'client-testimonials'],
  ['staff-highlight', 'team-highlight'],
  ['facilities-section', 'offices-section'],
  ['principal-welcome', 'founder-welcome'],
  ['info-board', 'latest-updates'],

  // URLs
  ['/program', '/layanan'],
  ['/prestasi', '/portofolio'],
  ['/alumni', '/testimoni'],
  ['/gtk', '/tim'],
  ['/berita', '/blog'],
  ['/agenda', '/event'],
  ['/fasilitas', '/kantor'],
  ['/unduhan', '/download'],
  ['/profil', '/tentang'],
  
  // JSON-LD
  ['EducationalOrganization', 'LocalBusiness']
];

function replaceInFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf-8');
    let newContent = content;
    
    // Custom replacements for specific files
    if (filePath.includes('stats-bar.tsx')) {
        // We will just do a blind replace of the old labels in the themes where stats is defined, 
        // but stats-bar is generic, it just receives props.
    }
    
    for (const [search, replace] of globalReplacements) {
        // Escape search for regex if needed, or just use split.join for simplicity and safety
        newContent = newContent.split(search).join(replace);
    }
    
    // Also remove ExtracurricularsSection from index.tsx and layout.tsx
    newContent = newContent.replace(/<ExtracurricularsSection[^>]*\/>/g, '');
    newContent = newContent.replace(/import \{ ExtracurricularsSection \}[^\n]*\n/g, '');

    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf-8');
        console.log(`Updated: ${filePath}`);
    }
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'pages' && !file.startsWith('.')) { // Skip pages to avoid too much nesting for now, but wait, maybe we should process everything?
                processDirectory(fullPath);
            }
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            replaceInFile(fullPath);
        }
    }
}

// 1. Rename files in _components
for (const [oldName, newName] of Object.entries(renames)) {
    const oldPath = path.join(componentsDir, oldName);
    const newPath = path.join(componentsDir, newName);
    if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        console.log(`Renamed: ${oldName} -> ${newName}`);
    }
}

// Delete extracurriculars-section.tsx
const extraPath = path.join(componentsDir, 'extracurriculars-section.tsx');
if (fs.existsSync(extraPath)) {
    fs.unlinkSync(extraPath);
    console.log(`Deleted: extracurriculars-section.tsx`);
}

// 2. Process all ts/tsx files in siteDir
processDirectory(siteDir);

console.log('Refactoring completed successfully.');
