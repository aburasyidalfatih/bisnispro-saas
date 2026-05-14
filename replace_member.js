const fs = require('fs');
const path = require('path');

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (p.endsWith('.ts') || p.endsWith('.tsx')) {
      let content = fs.readFileSync(p, 'utf8');
      if (content.includes('|| "member"')) {
        content = content.replace(/\|\|\s*"member"/g, '|| "orangtua"');
        fs.writeFileSync(p, content);
        console.log('Updated', p);
      }
    }
  }
}

walk('src');
