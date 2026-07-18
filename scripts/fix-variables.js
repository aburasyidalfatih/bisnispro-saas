const fs = require('fs');
const glob = require('glob');

function processFiles(pattern) {
  const files = glob.sync(pattern);
  let changedFiles = 0;

  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    content = content.replace(/currentLembaga/g, 'currentTenant');
    content = content.replace(/isImpersonatingLembaga/g, 'isImpersonatingTenant');
    content = content.replace(/activeLembaga/g, 'activeTenant');
    content = content.replace(/isLoadingLembaga/g, 'isLoadingTenant');
    
    // Also fix any other camelCase variables that might have been accidentally changed
    // if there was a trailing space. But only if they end in Lembaga.
    content = content.replace(/([a-z])Lembaga([^A-Za-z])/g, '$1Tenant$2');

    if (original !== content) {
      fs.writeFileSync(file, content);
      changedFiles++;
      console.log('Fixed variable names in: ' + file);
    }
  });
  return changedFiles;
}

let total = 0;
total += processFiles('src/**/*.tsx');
total += processFiles('src/**/*.ts');
console.log('Total fixed: ' + total);
