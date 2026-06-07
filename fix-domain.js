const fs = require('fs');
const path = 'c:\\grafity project\\schoolpro\\src\\features\\tenant\\services\\tenant-modular.service.ts';
let content = fs.readFileSync(path, 'utf8');

const newFields = `
            domain: true,
            phone: true,
            email: true,
            address: true,
            facebook: true,
            instagram: true,
            youtube: true,
            tiktok: true,
            tagline: true,
            description: true,
            logo: true,`;
            
if (!content.includes('youtube: true')) {
    content = content.replace(/gallery: true,/g, 'gallery: true,' + newFields);
    fs.writeFileSync(path, content, 'utf8');
}
