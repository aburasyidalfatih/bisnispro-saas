const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'src', 'app', 'api', 'admin', 'website');
const folders = ['services', 'portfolio', 'team', 'testimonials', 'offices'];

for (const folder of folders) {
  // Fix route.ts
  const indexRoute = path.join(baseDir, folder, 'route.ts');
  if (fs.existsSync(indexRoute)) {
    let content = fs.readFileSync(indexRoute, 'utf-8');
    content = content.replace(/session\.user\.tenants\?\.\[0\]\?\.tenantId/g, '(session.user as any).tenants?.[0]?.id');
    
    // Fix Team role vs position
    if (folder === 'team') {
      content = content.replace(/role/g, 'position');
    }
    
    fs.writeFileSync(indexRoute, content);
  }
  
  // Fix [id]/route.ts
  const idRoute = path.join(baseDir, folder, '[id]', 'route.ts');
  if (fs.existsSync(idRoute)) {
    let content = fs.readFileSync(idRoute, 'utf-8');
    content = content.replace(/session\.user\.tenants\?\.\[0\]\?\.tenantId/g, '(session.user as any).tenants?.[0]?.id');
    
    // Fix Next 15 params promise
    content = content.replace(
      /export async function PUT\(req: Request, \{ params \}: \{ params: \{ id: string \} \}\) \{/g, 
      'export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {\n  const resolvedParams = await params;'
    );
    content = content.replace(/params\.id/g, 'resolvedParams.id');
    
    content = content.replace(
      /export async function DELETE\(req: Request, \{ params \}: \{ params: \{ id: string \} \}\) \{/g, 
      'export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {\n  const resolvedParams = await params;'
    );
    
    // Fix Team role vs position
    if (folder === 'team') {
      content = content.replace(/role/g, 'position');
    }
    
    fs.writeFileSync(idRoute, content);
  }
}
console.log("Routes fixed.");
