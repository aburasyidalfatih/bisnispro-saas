const { PrismaClient } = require('./node_modules/.prisma/client');
const prisma = new PrismaClient();
async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { slug: 'demo' }});
  console.log(tenant);
}
main().catch(console.error).finally(() => prisma.$disconnect());
