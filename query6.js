const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const t = await prisma.tenant.findUnique({ where: { slug: 'mtsraudlatulmutaalliminbandaran' } });
  console.log('TENANT:', t);
}
run();
