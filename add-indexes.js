const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');
const modelRegex = /model\s+(\w+)\s+\{([^}]+)\}/g;
let modified = false;
let match;
while ((match = modelRegex.exec(content)) !== null) {
  const modelName = match[1];
  const body = match[2];
  if (body.includes('createdAt') && !body.includes('@@index([createdAt])')) {
    // Add index before the last closing brace or end of string
    const newBody = body + '\n  @@index([createdAt])\n';
    content = content.replace(match[0], `model ${modelName} {${newBody}}`);
    modified = true;
    console.log(`Added index to ${modelName}`);
  }
}
if (modified) {
  fs.writeFileSync('prisma/schema.prisma', content);
  console.log('Schema updated.');
} else {
  console.log('No changes needed.');
}
