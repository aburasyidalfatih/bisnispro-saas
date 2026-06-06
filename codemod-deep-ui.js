const fs = require('fs');
const path = require('path');

const targetDirs = [
  path.join(__dirname, 'src', 'app', '(dashboard)'),
  path.join(__dirname, 'src', 'app', '(super-admin)'),
  path.join(__dirname, 'src', 'app', '(affiliate)'),
  path.join(__dirname, 'src', 'components', 'shared')
];

let modifiedCount = 0;

function analyzeAndFixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  const buttonRegex = /<Button([^>]*)>([\s\S]*?)<\/Button>/g;
  
  content = content.replace(buttonRegex, (match, attrString, innerContent) => {
    // Ignore if it already has a variant explicitly set
    if (attrString.includes('variant=')) {
      return match;
    }
    
    // Check 1: Button with hover:underline (text link)
    if (attrString.includes('hover:underline')) {
      return `<Button variant="ghost" className="p-0 h-auto" ${attrString.replace('className="', 'className="') /* dummy to avoid breaking */}>${innerContent}</Button>`.replace('className="p-0 h-auto"  ', ''); // cleanup if needed
      // Better way to inject:
    }
    
    // Check 2: Icon-only button
    const justIconRegex = /^\s*<[A-Z][a-zA-Z0-9]+\s+[^>]*\/>\s*$/;
    if (justIconRegex.test(innerContent)) {
       return `<Button variant="ghost" size="icon"${attrString}>${innerContent}</Button>`;
    }
    
    // Check 3: Complex structural buttons
    if (innerContent.includes('<div') || innerContent.includes('<p') || innerContent.includes('<span className="flex')) {
      if (innerContent.includes('flex ') || innerContent.includes('grid ') || innerContent.includes('rounded-')) {
         // Revert to native <button>
         return `<button${attrString}>${innerContent}</button>`;
      }
    }

    // Check 4: hover:underline fallback logic
    if (attrString.includes('hover:underline')) {
        return `<Button variant="ghost"${attrString}>${innerContent}</Button>`;
    }

    return match;
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[FIXED] ${filePath}`);
    modifiedCount++;
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
      analyzeAndFixFile(fullPath);
    }
  }
}

console.log("Running UI button codemod...");
for (const dir of targetDirs) {
  walkDir(dir);
}

console.log(`Done! Modified ${modifiedCount} files.`);
