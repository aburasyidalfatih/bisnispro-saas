const fs = require('fs');
const path = require('path');

function replaceFile(filePath, search, replace) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(search)) {
    content = content.replace(search, replace);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[FIXED] ${filePath}`);
  }
}

// 1. notification-settings.tsx (switch)
const notifSettingsPath = path.join(__dirname, 'src/app/(dashboard)/admin/settings/_components/notification-settings.tsx');
let notifSearch = `<Button onClick={() => toggleNotif(ch.key)}
                  className={cn("relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ml-2",
                    active ?"bg-primary" :"bg-muted-foreground/30")}
                  role="switch" aria-checked={active}>
                  <span className={cn("inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
                    active ?"translate-x-4" :"translate-x-0.5")} />
                </Button>`;
let notifReplace = `<button onClick={() => toggleNotif(ch.key)}
                  className={cn("relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ml-2",
                    active ?"bg-primary" :"bg-muted-foreground/30")}
                  role="switch" aria-checked={active}>
                  <span className={cn("inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
                    active ?"translate-x-4" :"translate-x-0.5")} />
                </button>`;
replaceFile(notifSettingsPath, notifSearch, notifReplace);

// 2. attendance-settings.tsx (switch)
const attendanceSettingsPath = path.join(__dirname, 'src/app/(dashboard)/admin/settings/_components/attendance-settings.tsx');
let attSearch = `<Button onClick={() => handleUpdateLocal("attendanceRequireSelfie", !rawSettings.attendanceRequireSelfie)}
            className={cn("relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ml-2",
              rawSettings.attendanceRequireSelfie ?"bg-primary" :"bg-muted-foreground/30")}
            role="switch" aria-checked={rawSettings.attendanceRequireSelfie}>
            <span className={cn("inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
              rawSettings.attendanceRequireSelfie ?"translate-x-4" :"translate-x-0.5")} />
          </Button>`;
let attReplace = `<button onClick={() => handleUpdateLocal("attendanceRequireSelfie", !rawSettings.attendanceRequireSelfie)}
            className={cn("relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ml-2",
              rawSettings.attendanceRequireSelfie ?"bg-primary" :"bg-muted-foreground/30")}
            role="switch" aria-checked={rawSettings.attendanceRequireSelfie}>
            <span className={cn("inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
              rawSettings.attendanceRequireSelfie ?"translate-x-4" :"translate-x-0.5")} />
          </button>`;
replaceFile(attendanceSettingsPath, attSearch, attReplace);

// Let's also do a global replace for any remaining <Button that is just an eye icon
const targetDirs = [
  path.join(__dirname, 'src', 'app', '(dashboard)'),
  path.join(__dirname, 'src', 'app', '(super-admin)'),
  path.join(__dirname, 'src', 'app', '(affiliate)'),
  path.join(__dirname, 'src', 'components', 'shared')
];

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      // Replace <Button ...> {cond ? <EyeOff /> : <Eye />} </Button>
      // if it has text-muted-foreground but NO variant
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

      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`[FIXED EYE] ${fullPath}`);
      }
    }
  }
}

walkDir(path.join(__dirname, 'src'));

