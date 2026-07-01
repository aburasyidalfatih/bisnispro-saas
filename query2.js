const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const c = await prisma.user.count();
  console.log('Total users:', c);
  const tenants = await prisma.tenant.findMany({ select: { slug: true, name: true } });
  console.log('Tenants:', tenants);
}
run();
