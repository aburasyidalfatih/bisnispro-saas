const fs = require("fs");
let content = fs.readFileSync("src/features/tenant/services/tenant-modular.service.ts", "utf8");
content = content.replace(/select: \{ staff: true, programs: true, achievements: true \}/g, "select: { }");
content = content.replace(/staff: \{.*\},/g, "");
content = content.replace(/alumni: \{.*\},/g, "");
content = content.replace(/programs: \{.*\},/g, "");
content = content.replace(/extracurriculars: \{.*\},/g, "");
content = content.replace(/facilities: \{.*\},/g, "");
content = content.replace(/achievements: \{.*\},/g, "");
content = content.replace(/select: \{ staff: true, alumni: true, programs: true, extracurriculars: true \}/g, "select: { }");

const dummyFunction = (name) => `export const ${name} = async (slug: string) => { return null }`;

content = content.replace(/export const getTenantAlumni = async \(slug: string\) => \{[\s\S]*?\n\}\)\(\)\n\}/g, dummyFunction("getTenantAlumni"));
content = content.replace(/export const getTenantStaff = async \(slug: string\) => \{[\s\S]*?\n\}\)\(\)\n\}/g, dummyFunction("getTenantStaff"));
content = content.replace(/export const getTenantPrograms = async \(slug: string\) => \{[\s\S]*?\n\}\)\(\)\n\}/g, dummyFunction("getTenantPrograms"));
content = content.replace(/export const getTenantFacilities = async \(slug: string\) => \{[\s\S]*?\n\}\)\(\)\n\}/g, dummyFunction("getTenantFacilities"));
content = content.replace(/export const getTenantExtracurriculars = async \(slug: string\) => \{[\s\S]*?\n\}\)\(\)\n\}/g, dummyFunction("getTenantExtracurriculars"));
content = content.replace(/export const getTenantAchievements = async \(slug: string\) => \{[\s\S]*?\n\}\)\(\)\n\}/g, dummyFunction("getTenantAchievements"));

content = content.replace(/staffProfiles: \{[^}]+\}/g, "");
fs.writeFileSync("src/features/tenant/services/tenant-modular.service.ts", content, "utf8");
