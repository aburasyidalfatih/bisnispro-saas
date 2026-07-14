const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.platformSetting.deleteMany({
    where: {
      key: {
        in: [
          'RETENTION_60_EMAIL_BODY', 'RETENTION_60_WA',
          'RETENTION_90_EMAIL_BODY', 'RETENTION_90_WA',
          'WA_TEMPLATE_APPROVED'
        ]
      }
    }
  });
  console.log('Cleared remaining retention keys and approved template!');
}
main().then(() => prisma.$disconnect());
