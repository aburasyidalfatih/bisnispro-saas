const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.tenant.upsert({
    where: { id: 'platform' },
    update: {},
    create: {
      id: 'platform',
      name: 'Global Platform',
      slug: 'platform',
      plan: 'enterprise',
      isActive: true
    }
  });
  console.log('Platform tenant created successfully');
}
main().catch(console.error).finally(() => prisma.$disconnect());
