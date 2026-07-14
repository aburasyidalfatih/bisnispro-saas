const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.platformSetting.deleteMany({
    where: {
      key: {
        in: ['RETENTION_30_EMAIL_BODY', 'RETENTION_30_WA']
      }
    }
  });
  console.log('Cleared Retention 30!');
}
main().then(() => prisma.$disconnect());
