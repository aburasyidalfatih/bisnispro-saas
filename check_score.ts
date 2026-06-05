import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { slug: 'smpn1randuagung' } });
  console.log('Tenant:', tenant?.name, tenant?.id);

  if (tenant) {
    const score = await prisma.tenantScore.findUnique({ where: { tenantId: tenant.id } });
    console.log('Score:', score);

    const notifications = await prisma.notification.findMany({ 
      where: { tenantId: tenant.id, title: { contains: 'Poin' } }, 
      orderBy: { createdAt: 'desc' }, 
      take: 20 
    });

    console.log('Recent Points History:');
    notifications.forEach(n => console.log(`- [${n.createdAt}] ${n.title}: ${n.message}`));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
