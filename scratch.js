const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.platformSetting.deleteMany({
    where: {
      key: {
        in: ['DORMANT_WA_TEMPLATE', 'DORMANT_EMAIL_SUBJECT', 'DORMANT_EMAIL_HTML']
      }
    }
  });
  console.log('Cleared!');
}
main().then(() => prisma.$disconnect());
