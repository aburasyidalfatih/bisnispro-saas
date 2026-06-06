const fs = require('fs');
const path = require('path');

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walkDir('src/app');
let fixed = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    let useClientIdx = -1;
    let hasUseClient = false;
    
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
        if (lines[i].includes('"use client"') || lines[i].includes("'use client'")) {
            useClientIdx = i;
            hasUseClient = true;
            break;
        }
    }
    
    // Only fix if "use client" is not the first non-empty line (index > 0)
    if (hasUseClient && useClientIdx > 0) {
        // Find if there are actually imports before it
        let hasImportsBefore = false;
        for (let i = 0; i < useClientIdx; i++) {
            if (lines[i].trim().startsWith('import ') || lines[i].trim().startsWith('//')) {
                hasImportsBefore = true;
                break;
            }
        }
        
        if (hasImportsBefore) {
            const useClientLine = lines.splice(useClientIdx, 1)[0];
            lines.unshift(useClientLine);
            fs.writeFileSync(file, lines.join('\n'));
            console.log('Fixed:', file);
            fixed++;
        }
    }
});

console.log('Total fixed:', fixed);
