const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const result = await prisma.waQueueLog.updateMany({
    where: { status: 'PENDING' },
    data: { status: 'SENT', error: 'Cleared manually' }
  });
  console.log(result);
}
main().catch(console.error).finally(() => prisma.$disconnect());
