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

      // Fix 1: role="switch" using <Button ... role="switch" ...> -> <button ... role="switch" ...>
      const switchRegex = /<Button([\s\S]*?role="switch"[\s\S]*?)>([\s\S]*?)<\/Button>/g;
      if (switchRegex.test(content)) {
        content = content.replace(switchRegex, '<button$1>$2</button>');
        changed = true;
      }

      // Fix 2: Password Eye icons using <Button ...><Eye ...></Button> without variant
      const eyeRegex = /(<Button[^>]*?)(text-muted-foreground)([^>]*?>)([\s\S]*?<Eye(?:Off)?[\s\S]*?<\/Button>)/g;
      if (eyeRegex.test(content)) {
        content = content.replace(eyeRegex, (match, p1, p2, p3, p4) => {
          if (!match.includes('variant=')) {
            changed = true;
            return `${p1}variant="ghost" size="icon" ${p2}${p3.replace('absolute right-3', 'absolute right-1 h-8 w-8')}${p4}`;
          }
          return match;
        });
      }

      // Fix 3: Tandai Semua buttons
      if (fullPath.includes('notif-recent-list.tsx')) {
        if (content.includes('<Button onClick={markAllRead}')) {
          content = content.replace(/<Button onClick={markAllRead} className="([^"]*)"/g, '<Button variant="ghost" onClick={markAllRead} className="$1 h-auto p-1"');
          changed = true;
        }
      }

      // Fix 4: any other <Button> that contains just an Eye or EyeOff and text-primary (e.g. view details)
      const eyeDetailsRegex = /(<Button[^>]*?>)([\s\S]*?<Eye(?:Off)?[\s\S]*?<\/Button>)/g;
      if (eyeDetailsRegex.test(content)) {
          // Note: careful not to match too broad
      }

      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`[FIXED] ${fullPath}`);
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
