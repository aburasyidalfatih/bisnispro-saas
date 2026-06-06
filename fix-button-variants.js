const fs = require('fs');
const path = require('path');

const targetDirs = [
  path.join(__dirname, 'src', 'app', '(dashboard)'),
  path.join(__dirname, 'src', 'app', '(super-admin)'),
  path.join(__dirname, 'src', 'app', '(affiliate)'),
  path.join(__dirname, 'src', 'components', 'shared')
];

let modifiedFiles = 0;

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // We are looking for <Button ... className={cn("...", condition ? "..." : "...")} without variant="..."
  // It's a bit hard to match perfectly with regex. 
  // Let's use a simpler heuristic:
  // If we find <Button and it doesn't have variant=" and inside its className it has things like "hover:bg-muted" or "border-2"
  
  // Actually, let's just do a manual pass over the code for <Button ...>
  let newContent = "";
  let i = 0;
  let changed = false;

  while (i < content.length) {
    let buttonStart = content.indexOf('<Button', i);
    if (buttonStart === -1) {
      newContent += content.slice(i);
      break;
    }

    newContent += content.slice(i, buttonStart);
    let buttonEnd = content.indexOf('>', buttonStart);
    if (buttonEnd === -1) break; // malformed

    let buttonTag = content.slice(buttonStart, buttonEnd + 1);
    
    // Check if it has variant
    if (!buttonTag.includes('variant=') && !buttonTag.includes('variant {') && !buttonTag.includes('variant={')) {
      // Check if it's acting as a structural card / has custom background handling
      if (
        buttonTag.includes('border-2') || 
        buttonTag.includes('hover:bg-muted') || 
        buttonTag.includes('bg-muted') ||
        buttonTag.includes('flex-col') ||
        buttonTag.includes('justify-between') ||
        (buttonTag.includes('className={cn(') && (buttonTag.includes('bg-') || buttonTag.includes('text-muted')))
      ) {
        // Inject variant="outline" right after <Button
        buttonTag = buttonTag.replace('<Button', '<Button variant="outline"');
        changed = true;
      }
    }
    
    newContent += buttonTag;
    i = buttonEnd + 1;
  }

  if (changed) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`[MODIFIED] ${filePath}`);
    modifiedFiles++;
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
      processFile(fullPath);
    }
  }
}

console.log("Starting Button variant injection...");
for (const dir of targetDirs) {
  walkDir(dir);
}
console.log(`Done! Modified ${modifiedFiles} files.`);
