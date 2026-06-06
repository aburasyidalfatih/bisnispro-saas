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
  
  // Find <Button>...</Button>
  const buttonRegex = /<Button([\s\S]*?)>([\s\S]*?)<\/Button>/g;
  let match;
  while ((match = buttonRegex.exec(content)) !== null) {
    const props = match[1];
    let inner = match[2].trim();
    
    // Remove comments
    inner = inner.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').trim();
    
    // Check if inner content is ONLY a single component (e.g. <Trash2 ... /> or <Trash2></Trash2>)
    // And NO text.
    const isSingleComponent = /^<([A-Z][A-Za-z0-9]+)(?:\s+[^>]*?)?(?:\/>|>\s*<\/\1>)$/.test(inner);
    
    // Also, handle cases where there might be a conditional rendering, e.g. {loading ? <Loader /> : <Trash />}
    // We will skip those for now or just check the simple cases.
    
    if (isSingleComponent) {
      // It's an icon-only button!
      // Check if it has size="icon" or size={'icon'}
      if (!props.includes('size="icon"') && !props.includes("size={'icon'}") && !props.includes('size={"icon"}')) {
        // Exclude if it has children prop?
        if (!props.includes('children=')) {
          issues.push({
            file,
            issue: 'Icon-only Button lacking size="icon"',
            props: props.replace(/\s+/g, ' '),
            inner
          });
        }
      }
    }
  }

  // Deep check for `btn-gradient` just to be absolutely sure
  const btnGradientRegex = /className=\{?[`"'][^`"']*btn-gradient[^`"']*[`"']\}?/g;
  let bgMatch;
  while ((bgMatch = btnGradientRegex.exec(content)) !== null) {
    const cls = bgMatch[0];
    if (!cls.includes('flex') || !cls.includes('items-center') || !cls.includes('justify-center')) {
       // It could be inline-flex
       if (!cls.includes('inline-flex')) {
         issues.push({ file, issue: 'btn-gradient missing flex layout', match: cls });
       }
    }
  }
});

fs.writeFileSync('deep_audit_report.json', JSON.stringify(issues, null, 2), 'utf8');
const counts = {};
issues.forEach(i => counts[i.issue] = (counts[i.issue] || 0) + 1);
console.log("Deep Audit complete. Summary:", counts);
