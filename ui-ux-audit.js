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

const issues = {
  hardcodedWidths: [],
  missingResponsiveBreakpoints: [],
  rawImgTags: [],
  emptyHrefs: [],
  absoluteWithoutRelative: [],
  genericColorsInButtons: []
};

walk(srcDir, (file) => {
  const content = fs.readFileSync(file, 'utf8');

  // Check 1: Hardcoded large widths without responsiveness (e.g., w-[500px] but no max-w-full or sm:w-)
  // We'll look for w-\[[0-9]{3,}px\] that aren't preceded by sm: or md: or lg:
  const hardcodedWidthRegex = /(?<!sm:|md:|lg:|xl:|2xl:)\bw-\[[0-9]{3,}px\]/g;
  let match;
  while ((match = hardcodedWidthRegex.exec(content)) !== null) {
      // Just a heuristic
      issues.hardcodedWidths.push({ file, snippet: match[0] });
  }

  // Check 2: Raw <img> tags instead of Next.js <Image>
  const rawImgRegex = /<img\b[^>]*>/g;
  while ((match = rawImgRegex.exec(content)) !== null) {
      issues.rawImgTags.push({ file, snippet: match[0].substring(0, 50) });
  }

  // Check 3: Empty hrefs (href="#" or href="")
  const emptyHrefRegex = /href=["']#?["']/g;
  while ((match = emptyHrefRegex.exec(content)) !== null) {
      issues.emptyHrefs.push({ file, snippet: match[0] });
  }

  // Check 4: Absolute positioned elements without a clear relative parent. 
  // This is hard to detect perfectly with regex, but we can look for `absolute` followed by `right-` or `left-` 
  // and see if `relative` is in the same file as a rough proxy, but that's too noisy. Let's skip.

  // Check 5: Buttons using hardcoded colors instead of theme vars (like bg-blue-500, bg-red-500)
  // Shadcn UI encourages variants (variant="destructive") or bg-primary.
  const hardcodedColorBtnRegex = /<Button[^>]*className=["'][^"']*\bbg-(blue|red|green|yellow|indigo|purple|pink)-[456]00\b[^"']*["']/g;
  while ((match = hardcodedColorBtnRegex.exec(content)) !== null) {
      issues.genericColorsInButtons.push({ file, snippet: match[0].substring(0, 100) });
  }

  // Check 6: Hidden mobile menus without proper aria attributes, or z-index abuse.
  // Look for extreme z-indexes
  const zIndexAbuseRegex = /\bz-\[?[9][0-9]{2,}\]?/g; // z-999 or higher
  while ((match = zIndexAbuseRegex.exec(content)) !== null) {
      // we'll push this to hardcoded widths array just for tracking
      issues.hardcodedWidths.push({ file, type: 'Z-Index abuse', snippet: match[0] });
  }
});

// Summarize
const summary = {
  hardcodedWidths: issues.hardcodedWidths.length,
  rawImgTags: issues.rawImgTags.length,
  emptyHrefs: issues.emptyHrefs.length,
  genericColorsInButtons: issues.genericColorsInButtons.length
};

fs.writeFileSync('ui_ux_audit_report.json', JSON.stringify(issues, null, 2), 'utf8');
console.log("UI/UX Audit complete. Summary:", summary);
