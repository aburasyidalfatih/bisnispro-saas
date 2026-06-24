const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const dc = await prisma.discountCode.findUnique({
    where: { code: 'HYGYZT' },
    include: { payments: true }
  });
  console.log(JSON.stringify(dc, null, 2));
}
main().finally(() => prisma.$disconnect());
