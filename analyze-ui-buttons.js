const fs = require('fs');
const path = require('path');

const targetDirs = [
  path.join(__dirname, 'src', 'app', '(dashboard)'),
  path.join(__dirname, 'src', 'app', '(super-admin)'),
  path.join(__dirname, 'src', 'app', '(affiliate)'),
  path.join(__dirname, 'src', 'components', 'shared')
];

let suspiciousButtons = [];

function analyzeFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find all <Button ...>...</Button>
  // We use a regex, but it might not perfectly match nested ones, but good for a heuristic
  const buttonRegex = /<Button([^>]*)>([\s\S]*?)<\/Button>/g;
  let match;
  while ((match = buttonRegex.exec(content)) !== null) {
    const attrString = match[1];
    const innerContent = match[2];
    
    // Ignore if it has a variant explicitly set
    if (attrString.includes('variant=')) {
      continue;
    }
    
    // Check 1: Button with only an icon inside (e.g. <Trash className... />)
    const justIconRegex = /^\s*<[A-Z][a-zA-Z0-9]+\s+[^>]*\/>\s*$/;
    if (justIconRegex.test(innerContent)) {
      suspiciousButtons.push({
        file: filePath,
        reason: 'Icon-only button without variant="ghost" size="icon"',
        code: match[0].trim()
      });
      continue;
    }
    
    // Check 2: Button with hover:underline (likely meant to be a text link)
    if (attrString.includes('hover:underline')) {
      suspiciousButtons.push({
        file: filePath,
        reason: 'Button has hover:underline, likely meant to be a text link',
        code: match[0].trim()
      });
      continue;
    }
    
    // Check 3: Absolute positioning (like the eye icons we fixed, maybe there are more like <Copy />)
    if (attrString.includes('absolute ') && (attrString.includes('right-') || attrString.includes('top-'))) {
       suspiciousButtons.push({
        file: filePath,
        reason: 'Absolute positioned button without variant',
        code: match[0].trim()
      });
      continue;
    }

    // Check 4: Buttons acting as structural wrappers (e.g. containing complex divs inside)
    if (innerContent.includes('<div') || innerContent.includes('<p') || innerContent.includes('<span className="flex')) {
      // Exclude simple spans
      if (innerContent.includes('flex ') || innerContent.includes('grid ') || innerContent.includes('rounded-')) {
         suspiciousButtons.push({
          file: filePath,
          reason: 'Button contains complex inner structure (flex/grid/divs)',
          code: match[0].trim()
        });
      }
    }
  }
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.jsx')) {
      analyzeFile(fullPath);
    }
  }
}

console.log("Analyzing UI components...");
for (const dir of targetDirs) {
  walkDir(dir);
}

console.log(`Found ${suspiciousButtons.length} suspicious buttons.`);

// Group by reason
const byReason = {};
suspiciousButtons.forEach(b => {
  if (!byReason[b.reason]) byReason[b.reason] = [];
  byReason[b.reason].push(b);
});

for (const reason in byReason) {
  console.log(`\n=== ${reason} (${byReason[reason].length}) ===`);
  byReason[reason].slice(0, 5).forEach(b => {
    let relPath = b.file.replace(__dirname, '');
    console.log(`- ${relPath}:\n  ${b.code.substring(0, 150).replace(/\n/g, ' ')}...`);
  });
}
