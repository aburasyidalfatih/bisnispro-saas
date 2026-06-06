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
  let changed = false;

  // 1. Fix password Eye icons
  // Search for <Button ... className="absolute right-3...
  // We can just regex replace <Button type="button" onClick={...} className="absolute right-3
  // with <Button type="button" variant="ghost" size="icon" onClick={...} className="absolute right-3
  // Let's use a simpler regex:
  const eyeRegex = /<Button ([^>]*?)(className="[^"]*absolute right-3[^"]*")[^>]*>(?:(?!<\/Button>).)*?<Eye/gs;
  if (eyeRegex.test(content)) {
    content = content.replace(/(<Button )([^>]*?)(className="[^"]*absolute right-3[^"]*")([^>]*>)((?:(?!<\/Button>).)*?<Eye(?:Off)?[\s\S]*?<\/Button>)/g, (match, p1, p2, p3, p4, p5) => {
      if (!match.includes('variant=')) {
        changed = true;
        return `${p1}variant="ghost" size="icon" ${p2}${p3.replace('absolute right-3', 'absolute right-1 h-8 w-8')}${p4}${p5}`;
      }
      return match;
    });
  }
  
  // Specific fix for ortu/parent-dashboard.tsx and siswa/page.tsx (showBalance eye)
  if (content.includes('showBalance ? <EyeOff')) {
    content = content.replace(/(<Button)([^>]*onClick={\(\) => setShowBalance\(!showBalance\)}[^>]*>)/g, (match, p1, p2) => {
      if (!match.includes('variant=')) {
        changed = true;
        return `${p1} variant="ghost" size="icon" className="h-6 w-6"${p2}`;
      }
      return match;
    });
  }

  // 2. Fix switch / toggle
  // Replace <Button ... role="switch" ...> with <button ... role="switch" ...>
  // Because the original tailwind classes for switch are built for native <button>
  const switchRegex = /<Button([^>]*role="switch"[^>]*)>([\s\S]*?)<\/Button>/g;
  if (switchRegex.test(content)) {
    content = content.replace(switchRegex, '<button$1>$2</button>');
    changed = true;
  }

  // 3. Fix "Tandai semua" text buttons in notif-recent-list
  if (filePath.includes('notif-recent-list.tsx')) {
    if (content.includes('<Button onClick={markAllRead} className="text-[11px]')) {
      content = content.replace('<Button onClick={markAllRead}', '<Button variant="ghost" onClick={markAllRead}');
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
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

console.log("Starting specific UI fixes...");
for (const dir of targetDirs) {
  walkDir(dir);
}
console.log(`Done! Modified ${modifiedFiles} files.`);
