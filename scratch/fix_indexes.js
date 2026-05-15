const fs = require('fs');

const schemaPath = './prisma/schema.prisma';
let content = fs.readFileSync(schemaPath, 'utf8');

const modelRegex = /model\s+(\w+)\s+{([^}]+)}/g;
let newContent = content;
let matches;

while ((matches = modelRegex.exec(content)) !== null) {
  const modelName = matches[1];
  const modelBody = matches[2];

  if (modelBody.includes('tenantId') && modelBody.includes('createdAt')) {
    // Check if the composite index already exists
    if (!modelBody.includes('@@index([tenantId, createdAt') && !modelBody.includes('@@index([createdAt, tenantId')) {
      // Find the last @@index or @@map
      const lastMapIndex = modelBody.lastIndexOf('@@map');
      if (lastMapIndex !== -1) {
        const replacement = `  @@index([tenantId, createdAt(sort: Desc)])\n  @@map`;
        const newBody = modelBody.replace(/@@map/, replacement.trim());
        newContent = newContent.replace(modelBody, newBody);
        console.log(`Added index to ${modelName}`);
      }
    }
  }
}

fs.writeFileSync(schemaPath, newContent);
console.log("Done updating schema.prisma");
