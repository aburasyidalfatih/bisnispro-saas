const fs = require('fs');
const p = fs.readFileSync('prisma/schema.prisma', 'utf8');
const models = p.split(/model\s+(\w+)\s+\{/);
let sql = '-- PostgreSQL Row Level Security (RLS) Setup for SchoolPro\n\n';

for (let i = 1; i < models.length; i += 2) {
  const name = models[i];
  const body = models[i + 1];
  if (body.includes('tenantId')) {
    sql += `ALTER TABLE "${name}" ENABLE ROW LEVEL SECURITY;\n`;
    sql += `DROP POLICY IF EXISTS "tenant_isolation_policy" ON "${name}";\n`;
    sql += `CREATE POLICY "tenant_isolation_policy" ON "${name}" FOR ALL USING ("tenantId" = current_setting('app.current_tenant', TRUE));\n\n`;
  }
}

fs.writeFileSync('scratch/rls-migration.sql', sql);
console.log('RLS SQL generated successfully.');
