const fs = require("fs");
let content = fs.readFileSync("src/features/tenant/services/tenant-modular.service.ts", "utf8");
content = content.replace(/select: \{ [\s\S]*?id: true,[\s\S]*?\}\s*\} \s*\},\s*category/g, "select: { name: true, avatar: true, bio: true, id: true } }, category");
fs.writeFileSync("src/features/tenant/services/tenant-modular.service.ts", content, "utf8");
