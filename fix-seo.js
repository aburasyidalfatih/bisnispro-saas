const fs = require('fs');

// 1. Update post schema
const schemaPath = 'c:\\grafity project\\schoolpro\\src\\features\\post\\schemas\\post.schema.ts';
let schemaContent = fs.readFileSync(schemaPath, 'utf8');
if (!schemaContent.includes('imageAlt')) {
    schemaContent = schemaContent.replace(
        /featuredImage: z\.string\(\)\.nullable\(\)\.optional\(\)\.transform\(v => !v \? null : v\),/,
        'featuredImage: z.string().nullable().optional().transform(v => !v ? null : v),\n  imageAlt: z.string().max(100, "Alt Text maksimal 100 karakter").nullable().optional().transform(v => !v ? null : v),'
    );
    fs.writeFileSync(schemaPath, schemaContent, 'utf8');
    console.log('Fixed post.schema.ts');
}

// 2. Update post form
const formPath = 'c:\\grafity project\\schoolpro\\src\\app\\(dashboard)\\admin\\website\\posts\\[id]\\page.tsx';
let formContent = fs.readFileSync(formPath, 'utf8');

if (!formContent.includes('imageAlt')) {
    // Add to defaultValues
    formContent = formContent.replace(
        /featuredImage:"",/,
        'featuredImage:"",\n      imageAlt:"",'
    );
    
    // Add to setValue in fetch
    formContent = formContent.replace(
        /setValue\("featuredImage", normalizeImageUrl\(d\.featuredImage\) \|\|""\)/,
        'setValue("featuredImage", normalizeImageUrl(d.featuredImage) ||"")\n        setValue("imageAlt", d.imageAlt ||"")'
    );
    
    // Add input field below ImageUploadDirect
    const altInput = `\n              <div className="mt-4 space-y-2">\n                <Label htmlFor="imageAlt" className="text-sm font-medium">Alt Text Gambar (SEO)</Label>\n                <Input \n                  id="imageAlt" \n                  {...register("imageAlt")} \n                  className="rounded-xl" \n                  placeholder="Deskripsikan gambar ini untuk Google..." \n                />\n                <p className="text-[10px] text-muted-foreground">Penting untuk aksesibilitas dan pencarian gambar Google (Google Images).</p>\n                {errors.imageAlt && <p className="text-xs text-red-500">{errors.imageAlt.message}</p>}\n              </div>`;
    
    formContent = formContent.replace(
        /<Input type="hidden" \{\.\.\.register\("featuredImage"\)\} \/>/,
        '<Input type="hidden" {...register("featuredImage")} />' + altInput
    );
    
    fs.writeFileSync(formPath, formContent, 'utf8');
    console.log('Fixed posts/[id]/page.tsx');
}
