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

let changedFiles = 0;

walk(srcDir, (file) => {
  const originalContent = fs.readFileSync(file, 'utf8');
  let content = originalContent;
  
  // Bug 2: btn-gradient missing layout alignments
  // We use string replacement with a replacer function
  const btnGradientRegex = /className="([^"]*btn-gradient[^"]*)"/g;
  
  content = content.replace(btnGradientRegex, (match, classString) => {
    let classes = classString.split(/\s+/).filter(Boolean);
    
    const hasFlex = classes.includes('flex') || classes.includes('inline-flex');
    const hasItemsCenter = classes.includes('items-center');
    const hasJustifyCenter = classes.includes('justify-center');
    
    const hasSize = classes.some(c => c.startsWith('h-') || c.startsWith('p-') || c.startsWith('px-') || c.startsWith('py-'));
    
    if (!hasFlex) classes.push('flex');
    if (!hasItemsCenter) classes.push('items-center');
    if (!hasJustifyCenter) classes.push('justify-center');
    
    if (!hasSize) {
      classes.push('h-10', 'px-4');
    }
    
    // Ensure uniqueness
    classes = [...new Set(classes)];
    
    return `className="${classes.join(' ')}"`;
  });

  // Also catch template literals like className={`... btn-gradient ...`}
  // Just a simple heuristic for template literals without complex expressions inside the classes
  const btnGradientTemplateRegex = /className=\{`([^`]*btn-gradient[^`]*)`\}/g;
  content = content.replace(btnGradientTemplateRegex, (match, classString) => {
    // If the template literal has complex expressions inside ${}, it might be tricky.
    // We will just append the missing classes at the end of the template string before the closing backtick
    let classesStr = "";
    
    const hasFlex = classString.includes('flex') || classString.includes('inline-flex');
    const hasItemsCenter = classString.includes('items-center');
    const hasJustifyCenter = classString.includes('justify-center');
    const hasSize = classString.match(/\b(h-|p-|px-|py-)/);

    if (!hasFlex) classesStr += " flex";
    if (!hasItemsCenter) classesStr += " items-center";
    if (!hasJustifyCenter) classesStr += " justify-center";
    if (!hasSize) classesStr += " h-10 px-4";

    if (classesStr) {
      return `className={\`${classString}${classesStr}\`}`;
    }
    return match;
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    changedFiles++;
  }
});

console.log(`Mass fix completed. Modified ${changedFiles} files.`);
