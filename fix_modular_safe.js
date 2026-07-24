const fs = require("fs");
let content = fs.readFileSync("src/features/tenant/services/tenant-modular.service.ts", "utf8");

// Remove _count selections of school modules
content = content.replace(/_count: \{\s*select: \{ staff: true, programs: true, achievements: true \}\s*\},\s*/g, "");
content = content.replace(/_count: \{\s*select: \{ staff: true, alumni: true, programs: true, extracurriculars: true \}\s*\}/g, "");

// Remove the include blocks of school modules
content = content.replace(/staff: \{.*\},\s*/g, "");
content = content.replace(/alumni: \{.*\},\s*/g, "");
content = content.replace(/programs: \{.*\},\s*/g, "");
content = content.replace(/extracurriculars: \{.*\},\s*/g, "");
content = content.replace(/facilities: \{.*\},\s*/g, "");
content = content.replace(/achievements: \{.*\},\s*/g, "");

// Remove staffProfiles
content = content.replace(/,\s*staffProfiles: \{[\s\S]*?\}/g, "");

// Replace functions safely
function replaceFunc(name) {
  const regex = new RegExp(`export const ${name} = async \\(slug: string\\) => \\{[\\s\\S]*?\\}\\)`, "g");
  content = content.replace(regex, `export const ${name} = async (slug: string) => { return null }`);
}

replaceFunc("getTenantAlumni");
replaceFunc("getTenantStaff");
replaceFunc("getTenantPrograms");
replaceFunc("getTenantFacilities");
replaceFunc("getTenantExtracurriculars");
replaceFunc("getTenantAchievements");

fs.writeFileSync("src/features/tenant/services/tenant-modular.service.ts", content, "utf8");
