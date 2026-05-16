const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.tenant.findMany({ where: { domain: 'pijm.sch.id' }, select: { id: true, name: true, slug: true, domain: true, settings: true } })
  .then(res => console.log(JSON.stringify(res, null, 2)))
  .catch(console.error)
  .finally(()=>prisma.$disconnect());
