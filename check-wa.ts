import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const pendingCount = await prisma.waQueueLog.count({
    where: { status: 'PENDING' }
  });
  
  const sentCount = await prisma.waQueueLog.count({
    where: { status: 'SENT' }
  });
  
  const failedCount = await prisma.waQueueLog.count({
    where: { status: 'FAILED' }
  });

  console.log(`=== WA Queue Status ===`);
  console.log(`PENDING: ${pendingCount}`);
  console.log(`SENT: ${sentCount}`);
  console.log(`FAILED: ${failedCount}`);
}

main().catch(e => {
  console.error(e);
}).finally(async () => {
  await prisma.$disconnect();
});
