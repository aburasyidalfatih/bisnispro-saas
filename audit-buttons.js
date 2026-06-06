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
  
  // Bug 1: Icon-only buttons lacking size="icon"
  const buttonRegex = /<Button([^>]*)>\s*(?:\{[^}]+\}\s*)?<([A-Z][a-zA-Z0-9]+)\s+[^>]*\/>\s*<\/Button>/g;
  let match;
  while ((match = buttonRegex.exec(content)) !== null) {
    const props = match[1];
    const iconName = match[2];
    if (!props.includes('size="icon"') && !props.includes("size={'icon'}") && !props.includes('className=') && !props.includes('children')) {
       issues.push({ file, issue: 'Icon-only button might be missing size="icon"', match: match[0].trim().substring(0, 80) });
    }
  }

  // Bug 2: btn-gradient missing layout alignments
  const btnGradientRegex = /className="[^"]*btn-gradient[^"]*"/g;
  while ((match = btnGradientRegex.exec(content)) !== null) {
    const cls = match[0];
    let flexMissing = false;
    let sizeMissing = false;
    
    if (!cls.includes('flex') || !cls.includes('items-center') || !cls.includes('justify-center')) {
      flexMissing = true;
    }
    if (!cls.includes('h-') && !cls.includes('p-') && !cls.includes('px-') && !cls.includes('py-')) {
      sizeMissing = true;
    }

    if (flexMissing && sizeMissing) {
      issues.push({ file, issue: 'btn-gradient missing both alignment and size', match: cls });
    } else if (flexMissing) {
      issues.push({ file, issue: 'btn-gradient missing flex/items-center/justify-center', match: cls });
    } else if (sizeMissing) {
      issues.push({ file, issue: 'btn-gradient missing height or padding', match: cls });
    }
  }
  
  // Bug 3: Custom toggle Switch using Button
  const customSwitchRegex = /<Button[^>]*onClick=\{\(\)\s*=>\s*set[a-zA-Z]+\(\![a-zA-Z]+\)\}[^>]*>\s*<span[^>]*translate-x[^>]*>\s*<\/span>\s*<\/Button>/g;
  while ((match = customSwitchRegex.exec(content)) !== null) {
      issues.push({ file, issue: 'Custom toggle using Button instead of Switch', match: match[0].trim().substring(0, 80) });
  }
});

fs.writeFileSync('button_audit_report.json', JSON.stringify(issues, null, 2), 'utf8');
const counts = {};
issues.forEach(i => counts[i.issue] = (counts[i.issue] || 0) + 1);
console.log("Audit complete. Summary:", counts);
