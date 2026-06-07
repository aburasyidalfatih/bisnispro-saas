const fs = require('fs');
const path = 'c:\\grafity project\\schoolpro\\src\\app\\(dashboard)\\admin\\website\\gallery\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('imageAlt?: string')) {
    // 1. Add imageAlt to interface
    content = content.replace(
        /caption: string/,
        'caption: string\n  imageAlt?: string'
    );
    
    // 2. Add input for altText in the UI
    const altInput = `\n                  <Input\n                    value={item.imageAlt || ""}\n                    onChange={e => {\n                      setGallery(prev => prev.map((img, idx) => idx === i ? { ...img, imageAlt: e.target.value } : img))\n                    }}\n                    placeholder="Alt text (SEO)..."\n                    maxLength={100}\n                    className="w-full text-xs bg-transparent border-t border-border/50 outline-none placeholder:text-muted-foreground/50 text-foreground mt-1"\n                  />`;
                  
    content = content.replace(
        /<Input\n                    value=\{item\.caption\}/,
        '<Input\n                    value={item.caption}'
    );
    
    content = content.replace(
        /placeholder="Tambah caption\.\.\."\n                    maxLength=\{100\}\n                    className="w-full text-xs bg-transparent border-0 outline-none placeholder:text-muted-foreground\/50 text-foreground"\n                  \/>/,
        'placeholder="Tambah caption..."\n                    maxLength={100}\n                    className="w-full text-xs bg-transparent border-0 outline-none placeholder:text-muted-foreground/50 text-foreground"\n                  />' + altInput
    );
    
    fs.writeFileSync(path, content, 'utf8');
    console.log('Fixed gallery page.tsx');
}
