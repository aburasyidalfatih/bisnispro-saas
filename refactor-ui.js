const fs = require('fs');
const path = require('path');

function walkDir(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
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

const targetDirs = [
    'src/app/(dashboard)',
    'src/app/(super-admin)',
    'src/app/(affiliate)',
    'src/components/shared'
];

let files = [];
targetDirs.forEach(dir => {
    files = files.concat(walkDir(dir));
});

let modifiedFiles = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    
    let needsButtonImport = false;
    let needsInputImport = false;
    let needsTextareaImport = false;
    
    // Replace <button>
    if (content.match(/<button\b/g)) {
        content = content.replace(/<button\b/g, '<Button');
        content = content.replace(/<\/button>/g, '</Button>');
        needsButtonImport = true;
    }
    
    // Replace <input>
    if (content.match(/<input\b/g)) {
        content = content.replace(/<input\b/g, '<Input');
        needsInputImport = true;
    }
    
    // Replace <textarea>
    if (content.match(/<textarea\b/g)) {
        content = content.replace(/<textarea\b/g, '<Textarea');
        content = content.replace(/<\/textarea>/g, '</Textarea>');
        needsTextareaImport = true;
    }
    
    if (content !== originalContent) {
        // Find last import line to append new imports
        const lines = content.split('\n');
        let lastImportIdx = -1;
        let hasUseClient = false;
        
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('import ')) {
                lastImportIdx = i;
            }
            if (lines[i].includes('"use client"') || lines[i].includes("'use client'")) {
                hasUseClient = true;
            }
        }
        
        const importsToAdd = [];
        if (needsButtonImport && !content.includes('import { Button }')) {
            importsToAdd.push('import { Button } from "@/components/ui/button"');
        }
        if (needsInputImport && !content.includes('import { Input }')) {
            importsToAdd.push('import { Input } from "@/components/ui/input"');
        }
        if (needsTextareaImport && !content.includes('import { Textarea }')) {
            importsToAdd.push('import { Textarea } from "@/components/ui/textarea"');
        }
        
        if (importsToAdd.length > 0) {
            // Insert after the last import, or at the top (but after 'use client' if it exists)
            if (lastImportIdx >= 0) {
                lines.splice(lastImportIdx + 1, 0, ...importsToAdd);
            } else {
                if (hasUseClient) {
                    lines.splice(1, 0, ...importsToAdd);
                } else {
                    lines.splice(0, 0, ...importsToAdd);
                }
            }
        }
        
        fs.writeFileSync(file, lines.join('\n'), 'utf8');
        console.log(`Refactored: ${file}`);
        modifiedFiles++;
    }
});

console.log(`\nSuccessfully refactored ${modifiedFiles} files.`);
