const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const tenants = await prisma.tenant.findMany({
    select: { id: true, name: true, slug: true, domain: true }
  });
  console.log("All Tenants:", tenants);
}

check()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
