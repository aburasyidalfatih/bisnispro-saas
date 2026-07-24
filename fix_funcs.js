const fs = require("fs");
let content = fs.readFileSync("src/features/tenant/services/tenant-modular.service.ts", "utf8");

function replaceFunc(name) {
  const regex = new RegExp(`export const ${name} = async \\(slug: string\\) => \\{[\\s\\S]*?\\}\\)\\(\\)\\n\\}`, "g");
  content = content.replace(regex, `export const ${name} = async (slug: string) => { return null }`);
}

replaceFunc("getTenantAlumni");
replaceFunc("getTenantStaff");
replaceFunc("getTenantPrograms");
replaceFunc("getTenantFacilities");
replaceFunc("getTenantExtracurriculars");
replaceFunc("getTenantAchievements");

fs.writeFileSync("src/features/tenant/services/tenant-modular.service.ts", content, "utf8");
