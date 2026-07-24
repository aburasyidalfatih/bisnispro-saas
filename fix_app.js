const fs = require("fs");
let content = fs.readFileSync("src/features/tenant/services/application.service.ts", "utf8");

content = content.replace(/npsn: app.npsn,\s*/g, "");
content = content.replace(/businessStatus: app.businessStatus,\s*/g, "");
content = content.replace(/schoolStatus: app.schoolStatus,\s*/g, "");

content = content.replace(/const existingStaff = await db\.staff\.findFirst\([\s\S]*?bio: \`Bertanggung jawab sebagai \$\{app\.adminPosition\} sekaligus pengelola sistem website bisnis.\`\s*\}\s*\}\)\s*\}/g, "/* staff removed */");
content = content.replace(/const existingStaff = await db\.staff\.findFirst\([\s\S]*?bio: \`Bertanggung jawab sebagai \$\{app\.adminPosition\} sekaligus pengelola sistem website sekolah.\`\s*\}\s*\}\)\s*\}/g, "/* staff removed */");
fs.writeFileSync("src/features/tenant/services/application.service.ts", content, "utf8");
