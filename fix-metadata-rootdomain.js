const fs = require('fs');
const path = require('path');

function walkSync(currentDirPath, callback) {
    fs.readdirSync(currentDirPath).forEach(function (name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        if (stat.isFile()) {
            callback(filePath, stat);
        } else if (stat.isDirectory()) {
            walkSync(filePath, callback);
        }
    });
}

walkSync('c:\\grafity project\\schoolpro\\src\\app\\site', function(filePath, stat) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let changed = false;

        // Find export async function generateMetadata({ ... }) {
        const regex = /export\s+async\s+function\s+generateMetadata\s*\([^)]+\)\s*\{/;
        const match = content.match(regex);
        if (match) {
            const generateMetadataIndex = match.index;
            // Check if rootDomain is used AFTER this point but BEFORE the next export default function
            const nextExportIndex = content.indexOf('export default ', generateMetadataIndex);
            const scope = content.substring(generateMetadataIndex, nextExportIndex !== -1 ? nextExportIndex : content.length);
            
            if (scope.includes('rootDomain') && !scope.includes('const rootDomain =')) {
                const insertPoint = generateMetadataIndex + match[0].length;
                const codeToInsert = "\n  const headerList = await headers();\n  const rootDomain = headerList.get('x-root-domain') || process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'schoolpro.id';";
                content = content.substring(0, insertPoint) + codeToInsert + content.substring(insertPoint);
                changed = true;
            }
        }

        if (changed) {
            if (!content.includes("import { headers } from \"next/headers\"")) {
                content = "import { headers } from \"next/headers\"\n" + content;
            }
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Fixed generateMetadata', filePath);
        }
    }
});
