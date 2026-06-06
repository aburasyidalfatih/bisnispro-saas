const fs = require('fs');
const path = require('path');

function processDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      // Split the file by '<Button' and check each chunk
      let chunks = content.split('<Button ');
      for (let i = 1; i < chunks.length; i++) {
        // Find the end of the <Button> ... </Button> sequence
        let chunk = chunks[i];
        let endIdx = chunk.indexOf('</Button>');
        if (endIdx !== -1) {
          let buttonContent = chunk.substring(0, endIdx + 9);
          
          if (buttonContent.includes('<Eye') && buttonContent.includes('text-muted-foreground') && !buttonContent.includes('variant=')) {
            // Replace the <Button part in the main content
            // To be safe, we just inject variant="ghost" size="icon" right after <Button 
            chunks[i] = 'variant="ghost" size="icon" ' + chunks[i];
            
            // Also optionally fix the absolute right-3 to right-1
            chunks[i] = chunks[i].replace('absolute right-3', 'absolute right-1 h-8 w-8');
            
            changed = true;
          }
        }
      }

      if (changed) {
        content = chunks.join('<Button ');
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`[FIXED EYE] ${fullPath}`);
      }
    }
  }
}

const targetDirs = [
  path.join(__dirname, 'src', 'app', '(dashboard)'),
  path.join(__dirname, 'src', 'app', '(super-admin)'),
  path.join(__dirname, 'src', 'app', '(affiliate)'),
  path.join(__dirname, 'src', 'components', 'shared')
];

for (const dir of targetDirs) {
  processDir(dir);
}
