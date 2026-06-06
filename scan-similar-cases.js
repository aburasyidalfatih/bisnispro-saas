const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      walk(filepath, callback);
    } else if (filepath.endsWith('.tsx') || filepath.endsWith('.jsx')) {
      callback(filepath);
    }
  }
}

const issues = [];

walk(srcDir, (file) => {
  const content = fs.readFileSync(file, 'utf8');
  
  // Bug 1: Custom Toggle Button instead of Switch
  // Matches something like: className="... translate-x ..." inside a Button
  // Actually let's look for `<Button` followed by `translate-x` before `</Button>`
  const btnToggleRegex = /<Button([^>]*)>[\s\S]*?<span[^>]*translate-x[^>]*>[\s\S]*?<\/Button>/g;
  let match;
  while ((match = btnToggleRegex.exec(content)) !== null) {
      issues.push({ file, type: 'Custom Toggle using Button', snippet: match[0].substring(0, 100).trim() });
  }

  // Bug 2: Eye icons in Buttons lacking variant="ghost"
  const eyeBtnRegex = /<Button([^>]*)>[\s\S]*?<(Eye|EyeOff)[\s\S]*?<\/Button>/g;
  while ((match = eyeBtnRegex.exec(content)) !== null) {
      const props = match[1];
      if (!props.includes('variant="ghost"') || !props.includes('size="icon"')) {
          issues.push({ file, type: 'Eye icon missing ghost/icon variant', snippet: match[0].substring(0, 100).trim() });
      }
  }
});

fs.writeFileSync('similar_cases_report.json', JSON.stringify(issues, null, 2), 'utf8');
const counts = {};
issues.forEach(i => counts[i.type] = (counts[i.type] || 0) + 1);
console.log("Scan complete. Summary:", counts);
