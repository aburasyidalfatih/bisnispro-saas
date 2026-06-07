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

        if (content.includes('generateMetadata') && content.includes('rootDomain') && !content.includes('process.env.NEXT_PUBLIC_ROOT_DOMAIN')) {
            // The file uses rootDomain in generateMetadata but doesn't define it.
            // We need to inject it right after export async function generateMetadata(...
            content = content.replace(/(export async function generateMetadata\(.*\) \{)/, "$1\n  const headerList = await headers();\n  const rootDomain = headerList.get('x-root-domain') || process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'schoolpro.id';");
            changed = true;
        }

        if (changed) {
            if (!content.includes("import { headers } from \"next/headers\"")) {
                content = "import { headers } from \"next/headers\"\n" + content;
            }
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Fixed', filePath);
        }
    }
});
